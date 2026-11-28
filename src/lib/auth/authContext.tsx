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
import { consumeAuthErrorMarker, mapOAuthErrorToBanner, type AuthErrorMarker } from './authErrorMarker'
import { consumeAuthResultMarker, type AuthResultMarker } from './authResultMarker'
import { AuthNativeError, type UserProfile } from './authTypes'
import { clearPendingAuthSession } from './pendingAuthAction'
import { createModalDismissTracker } from './modalDismiss'
import { reloadToRecoverSession } from './recoverSession'
import {
    loginFailureReason,
    recordAuthTrigger,
    settleAuthInit,
    signUpFailureReason,
    trackAuthPromptOpened,
    trackAuthSuccess,
} from './authAnalytics'
import { track } from '@/common/analytics/track'
import type { AuthModalTrigger } from '@/common/analytics/events'
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

export interface OpenAuthModalOptions {
    context?: AuthModalContext
    /** The prompt was already counted (dropdown menu shown): record the trigger only. */
    silent?: boolean
    /** Invoked when the user cancels/dismisses the modal (X or Escape), not on successful completion. */
    onDismiss?: () => void
}

interface AuthContextValue extends AuthState {
    openSignInModal(trigger: AuthModalTrigger, options?: OpenAuthModalOptions): void
    openSignUpModal(trigger: AuthModalTrigger, options?: OpenAuthModalOptions): void
    closeNativeAuthModal(): void
    completeNativeAuthModal(): void
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
    const dismissTracker = useRef(createModalDismissTracker())

    // Sync i18next language from the URL segment (e.g. /ru/pricing → 'ru')
    useEffect(() => {
        const segment = pathname.split('/')[1]
        const lang = normalizeLanguage(segment)
        if (i18n.language !== lang) {
            void i18n.changeLanguage(lang)
        }
    }, [pathname])

    // OAuth markers are stripped from the URL on first read; StrictMode runs the init effect
    // twice in development, so the first read is kept here for the second run.
    const markersRef = useRef<{ result: AuthResultMarker | null; error: AuthErrorMarker | null } | null>(null)

    // Auth init on mount
    useEffect(() => {
        let cancelled = false
        const markers = markersRef.current ??= {
            result: consumeAuthResultMarker(),
            error: consumeAuthErrorMarker(),
        }
        authApiClient.getMe().then(
            (user) => {
                if (cancelled) return
                // Before AUTH_INIT_DONE: the admin flag is set before AnalyticsInit sees the user.
                const authTrigger = settleAuthInit(markers, user)
                dispatch({ type: 'AUTH_INIT_DONE', user, authTrigger })
            },
            () => {
                if (cancelled) return
                settleAuthInit(markers, null)
                dispatch({ type: 'AUTH_INIT_DONE', user: null })
                if (markers.error) {
                    const banner = mapOAuthErrorToBanner(markers.error)
                    dispatch({ type: 'OPEN_OAUTH_ERROR', error: banner.error, notice: banner.notice })
                }
            },
        )
        return () => { cancelled = true }
    }, [])

    // Install token refresh interceptor
    useEffect(() => {
        installAuthInterceptor(() => dispatch({ type: 'SET_SESSION_EXPIRED', open: true }))
        return () => uninstallAuthInterceptor()
    }, [])

    const openAuthModal = useCallback((view: 'signIn' | 'signUp', trigger: AuthModalTrigger, options?: OpenAuthModalOptions) => {
        recordAuthTrigger(trigger)
        if (!options?.silent) trackAuthPromptOpened(view, trigger)
        dismissTracker.current.set(options?.onDismiss)
        dispatch({ type: 'OPEN_MODAL', view, context: options?.context })
    }, [])
    const openSignInModal = useCallback(
        (trigger: AuthModalTrigger, options?: OpenAuthModalOptions) => openAuthModal('signIn', trigger, options),
        [openAuthModal],
    )
    const openSignUpModal = useCallback(
        (trigger: AuthModalTrigger, options?: OpenAuthModalOptions) => openAuthModal('signUp', trigger, options),
        [openAuthModal],
    )
    const closeNativeAuthModal = useCallback(() => {
        signUpCredentials.current = null
        clearPendingAuthSession()
        dismissTracker.current.dismiss()
        dispatch({ type: 'CLOSE_MODAL' })
    }, [])
    const completeNativeAuthModal = useCallback(() => {
        signUpCredentials.current = null
        dismissTracker.current.complete()
        dispatch({ type: 'CLOSE_MODAL' })
    }, [])
    const setModalView = useCallback((view: ModalView, prefillEmail?: string) => dispatch({ type: 'SET_VIEW', view, prefillEmail }), [])
    const closeSessionExpiredModal = useCallback(() => dispatch({ type: 'SET_SESSION_EXPIRED', open: false }), [])

    /**
     * Called once the backend accepted the credentials, so it never throws: a failed getMe
     * still counts as a sign-in (the cookies are set) and never as login_failed.
     */
    const finishSignIn = useCallback(async (emit?: 'login' | 'sign_up') => {
        let user: UserProfile | null = null
        try {
            user = await authApiClient.getMe()
        } catch {
            // profile unavailable — recovered by the full reload below
        }
        signUpCredentials.current = null
        const authTrigger = trackAuthSuccess(emit ? [emit] : [], 'email', user)
        dismissTracker.current.complete()
        dispatch({ type: 'CLOSE_MODAL' })
        if (user) {
            dispatch({ type: 'AUTH_INIT_DONE', user, authTrigger })
            router.refresh()
        } else {
            // router.refresh() does not re-run the session check; without a reload the page
            // would keep showing "Sign in" although the user is signed in.
            void reloadToRecoverSession()
        }
    }, [router])

    const submitSignIn = useCallback(async (email: string, password: string) => {
        dispatch({ type: 'SET_LOADING', loading: true })
        try {
            try {
                await authApiClient.signIn(email, password)
            } catch (err) {
                // Sent for not_confirmed too, before the confirm-email branch, as in the editor.
                track({ name: 'login_failed', reason: loginFailureReason(err) })
                throw err
            }
            await finishSignIn('login')
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
            let res: Awaited<ReturnType<typeof authApiClient.signUp>>
            try {
                res = await authApiClient.signUp(email, password, displayName)
            } catch (err) {
                track({ name: 'sign_up_failed', step: 'submit', reason: signUpFailureReason(err) })
                dispatch({ type: 'SET_ERROR', error: errorKey(err) })
                return
            }
            track({ name: 'sign_up_submitted', method: 'email' })
            if (res.confirmationRequired) {
                signUpCredentials.current = { email, password }
                dispatch({ type: 'SET_PENDING_EMAIL', email })
                dispatch({ type: 'SET_VIEW', view: 'confirmEmail', prefillEmail: email })
                return
            }
            // The account exists already, but /auth/signup sets no cookies: sign in explicitly.
            try {
                await authApiClient.signIn(email, password)
            } catch {
                trackAuthSuccess(['sign_up'], 'email', null)
                dispatch({ type: 'SET_VIEW', view: 'signIn', prefillEmail: email })
                return
            }
            await finishSignIn('sign_up')
        } finally {
            dispatch({ type: 'SET_LOADING', loading: false })
        }
    }, [finishSignIn])

    const submitConfirmEmail = useCallback(async (email: string, code: string) => {
        dispatch({ type: 'SET_LOADING', loading: true })
        try {
            await authApiClient.confirmSignUp(email, code)
        } catch (err) {
            track({ name: 'sign_up_failed', step: 'confirm', reason: signUpFailureReason(err) })
            dispatch({ type: 'SET_ERROR', error: errorKey(err) })
            dispatch({ type: 'SET_LOADING', loading: false })
            return
        }

        dispatch({ type: 'SET_PENDING_EMAIL', email: null })
        const creds = signUpCredentials.current
        if (creds && creds.email === email) {
            let signedIn = false
            try {
                await authApiClient.signIn(creds.email, creds.password)
                signedIn = true
            } catch {
                // fall through to the manual sign-in screen
            }
            if (signedIn) {
                await finishSignIn('sign_up')
                dispatch({ type: 'SET_LOADING', loading: false })
                return
            }
        }
        // The account is confirmed: that is the sign-up, even without the automatic sign-in.
        trackAuthSuccess(['sign_up'], 'email', null)
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
                    // Signed in by a password reset: no login event, but the trigger is used up
                    // and an admin is marked internal.
                    const authTrigger = trackAuthSuccess([], 'email', user)
                    dispatch({ type: 'AUTH_INIT_DONE', user, authTrigger })
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
        completeNativeAuthModal,
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
