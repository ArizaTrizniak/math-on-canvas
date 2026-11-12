'use client'

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useReducer,
    useRef,
} from 'react'
import { useRouter, usePathname } from 'next/navigation'
import i18n from '@/lib/i18n'
import { normalizeLanguage } from '@/lib/i18n/constants'
import { authApiClient } from './authApiClient'
import { installAuthInterceptor, uninstallAuthInterceptor } from './authInterceptor'
import { mapNativeAuthError } from './mapAuthError'
import { AuthNativeError } from './authTypes'
import {
    authReducer,
    initialAuthState,
    type AuthModalContext,
    type AuthState,
    type ModalView,
} from './authReducer'

export type { AuthModalContext, ModalView } from './authReducer'

function errorKey(err: unknown): string {
    return err instanceof AuthNativeError ? mapNativeAuthError(err.code) : 'auth:errors.network'
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface AuthContextValue extends AuthState {
    openSignInModal(context?: AuthModalContext): void
    openSignUpModal(context?: AuthModalContext): void
    closeNativeAuthModal(): void
    setModalView(view: ModalView, prefillEmail?: string): void
    /** Resolves false when the credentials were rejected and the view should let the user retry. */
    submitSignIn(email: string, password: string): Promise<boolean>
    submitSignUp(email: string, password: string, displayName: string): Promise<void>
    submitConfirmEmail(email: string, code: string): Promise<void>
    /** Resolves true when the code went out, so the view can restart its cooldown. */
    resendConfirmCode(email: string): Promise<boolean>
    submitForgotPassword(email: string): Promise<void>
    resendResetCode(): Promise<boolean>
    submitResetPassword(code: string, newPassword: string): Promise<void>
    signOut(): Promise<void>
    closeSessionExpiredModal(): void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuthContext(): AuthContextValue {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
    return ctx
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(authReducer, initialAuthState)
    const router = useRouter()
    const pathname = usePathname()

    // Password typed at sign-up, kept in memory only so that confirming the
    // email can sign the user straight in ("Create account and open").
    const signUpCredentials = useRef<{ email: string; password: string } | null>(null)

    // Sync i18next language from the URL segment (e.g. /ru/pricing → 'ru')
    useEffect(() => {
        const segment = pathname.split('/')[1]
        const lang = normalizeLanguage(segment)
        if (i18n.language !== lang) {
            void i18n.changeLanguage(lang)
        }
    }, [pathname])

    // Auth init on mount
    useEffect(() => {
        let cancelled = false
        authApiClient.getMe().then(
            (user) => { if (!cancelled) dispatch({ type: 'AUTH_INIT_DONE', user }) },
            () => { if (!cancelled) dispatch({ type: 'AUTH_INIT_DONE', user: null }) },
        )
        return () => { cancelled = true }
    }, [])

    // Install token refresh interceptor
    useEffect(() => {
        installAuthInterceptor(() => dispatch({ type: 'SET_SESSION_EXPIRED', open: true }))
        return () => uninstallAuthInterceptor()
    }, [])

    const openSignInModal = useCallback((context?: AuthModalContext) => dispatch({ type: 'OPEN_MODAL', view: 'signIn', context }), [])
    const openSignUpModal = useCallback((context?: AuthModalContext) => dispatch({ type: 'OPEN_MODAL', view: 'signUp', context }), [])
    const closeNativeAuthModal = useCallback(() => {
        signUpCredentials.current = null
        dispatch({ type: 'CLOSE_MODAL' })
    }, [])
    const setModalView = useCallback((view: ModalView, prefillEmail?: string) => dispatch({ type: 'SET_VIEW', view, prefillEmail }), [])
    const closeSessionExpiredModal = useCallback(() => dispatch({ type: 'SET_SESSION_EXPIRED', open: false }), [])

    const finishSignIn = useCallback(async () => {
        const user = await authApiClient.getMe()
        signUpCredentials.current = null
        dispatch({ type: 'AUTH_INIT_DONE', user })
        dispatch({ type: 'CLOSE_MODAL' })
        router.refresh()
    }, [router])

    const submitSignIn = useCallback(async (email: string, password: string) => {
        dispatch({ type: 'SET_LOADING', loading: true })
        try {
            await authApiClient.signIn(email, password)
            await finishSignIn()
            return true
        } catch (err) {
            if (err instanceof AuthNativeError && err.code === 'user_not_confirmed') {
                signUpCredentials.current = { email, password }
                // best-effort — user sees confirmEmail view regardless of whether resend succeeds
                void authApiClient.resendCode(email).catch(() => {})
                dispatch({ type: 'SET_PENDING_EMAIL', email })
                dispatch({ type: 'SET_VIEW', view: 'confirmEmail', prefillEmail: email })
                return true
            }
            dispatch({ type: 'SET_ERROR', error: errorKey(err) })
            return false
        } finally {
            dispatch({ type: 'SET_LOADING', loading: false })
        }
    }, [finishSignIn])

    const submitSignUp = useCallback(async (email: string, password: string, displayName: string) => {
        dispatch({ type: 'SET_LOADING', loading: true })
        try {
            const res = await authApiClient.signUp(email, password, displayName)
            if (res.confirmationRequired) {
                signUpCredentials.current = { email, password }
                dispatch({ type: 'SET_PENDING_EMAIL', email })
                dispatch({ type: 'SET_VIEW', view: 'confirmEmail', prefillEmail: email })
            } else {
                await finishSignIn()
            }
        } catch (err) {
            dispatch({ type: 'SET_ERROR', error: errorKey(err) })
        } finally {
            dispatch({ type: 'SET_LOADING', loading: false })
        }
    }, [finishSignIn])

    const submitConfirmEmail = useCallback(async (email: string, code: string) => {
        dispatch({ type: 'SET_LOADING', loading: true })
        try {
            await authApiClient.confirmSignUp(email, code)
        } catch (err) {
            dispatch({ type: 'SET_ERROR', error: errorKey(err) })
            dispatch({ type: 'SET_LOADING', loading: false })
            return
        }

        dispatch({ type: 'SET_PENDING_EMAIL', email: null })
        const creds = signUpCredentials.current
        if (creds && creds.email === email) {
            try {
                await authApiClient.signIn(creds.email, creds.password)
                await finishSignIn()
                dispatch({ type: 'SET_LOADING', loading: false })
                return
            } catch {
                // fall through to the manual sign-in screen
            }
        }
        signUpCredentials.current = null
        dispatch({ type: 'SET_VIEW', view: 'signIn', prefillEmail: email })
        dispatch({ type: 'SET_NOTICE', notice: 'auth:notice.emailConfirmed' })
        dispatch({ type: 'SET_LOADING', loading: false })
    }, [finishSignIn])

    const resendConfirmCode = useCallback(async (email: string) => {
        try {
            await authApiClient.resendCode(email)
            dispatch({ type: 'SET_NOTICE', notice: 'auth:notice.codeResent' })
            return true
        } catch (err) {
            dispatch({ type: 'SET_ERROR', error: errorKey(err) })
            return false
        }
    }, [])

    const requestResetCode = useCallback(
        (email: string) => authApiClient.forgotPassword(email, normalizeLanguage(i18n.language)),
        [],
    )

    const submitForgotPassword = useCallback(async (email: string) => {
        dispatch({ type: 'SET_LOADING', loading: true })
        try {
            await requestResetCode(email)
            dispatch({ type: 'RESET_CODE_SENT', email })
        } catch (err) {
            dispatch({ type: 'SET_ERROR', error: errorKey(err) })
        } finally {
            dispatch({ type: 'SET_LOADING', loading: false })
        }
    }, [requestResetCode])

    const resendResetCode = useCallback(async () => {
        const email = state.pendingResetEmail
        if (!email) return false
        try {
            await requestResetCode(email)
            dispatch({ type: 'SET_NOTICE', notice: 'auth:notice.codeResent' })
            return true
        } catch (err) {
            dispatch({ type: 'SET_ERROR', error: errorKey(err) })
            return false
        }
    }, [state.pendingResetEmail, requestResetCode])

    const submitResetPassword = useCallback(async (code: string, newPassword: string) => {
        const email = state.pendingResetEmail
        if (!email) return
        dispatch({ type: 'SET_LOADING', loading: true })
        try {
            const res = await authApiClient.resetPassword(email, code, newPassword)
            let signedIn = false
            if (res.signedIn) {
                try {
                    const user = await authApiClient.getMe()
                    dispatch({ type: 'AUTH_INIT_DONE', user })
                    router.refresh()
                    signedIn = true
                } catch {
                    // cookies did not stick — offer manual sign-in instead
                }
            }
            dispatch({ type: 'RESET_DONE', signedIn })
        } catch (err) {
            dispatch({ type: 'SET_ERROR', error: errorKey(err) })
        } finally {
            dispatch({ type: 'SET_LOADING', loading: false })
        }
    }, [state.pendingResetEmail, router])

    const signOut = useCallback(async () => {
        dispatch({ type: 'SIGN_OUT' })
        await authApiClient.signOut()
        router.refresh()
    }, [router])

    const value: AuthContextValue = {
        ...state,
        openSignInModal,
        openSignUpModal,
        closeNativeAuthModal,
        setModalView,
        submitSignIn,
        submitSignUp,
        submitConfirmEmail,
        resendConfirmCode,
        submitForgotPassword,
        resendResetCode,
        submitResetPassword,
        signOut,
        closeSessionExpiredModal,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
