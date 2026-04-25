'use client'

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useReducer,
} from 'react'
import { useRouter, usePathname } from 'next/navigation'
import i18n from '@/lib/i18n'
import { normalizeLanguage } from '@/lib/i18n/constants'
import { authApiClient } from './authApiClient'
import { installAuthInterceptor, uninstallAuthInterceptor } from './authInterceptor'
import { mapNativeAuthError } from './mapAuthError'
import {
    AuthNativeError,
    AuthUnauthenticatedError,
    type UserProfile,
} from './authTypes'

// ─── State ───────────────────────────────────────────────────────────────────

type AuthStatus = 'loading' | 'authenticated' | 'guest'
type ModalView = 'signIn' | 'signUp' | 'confirmEmail'

interface AuthState {
    status: AuthStatus
    user: UserProfile | null
    nativeAuthModalOpen: boolean
    nativeAuthModalView: ModalView
    nativeAuthLoading: boolean
    nativeAuthError: string | null
    pendingConfirmEmail: string | null
    sessionExpiredModalOpen: boolean
}

const initialState: AuthState = {
    status: 'loading',
    user: null,
    nativeAuthModalOpen: false,
    nativeAuthModalView: 'signIn',
    nativeAuthLoading: false,
    nativeAuthError: null,
    pendingConfirmEmail: null,
    sessionExpiredModalOpen: false,
}

// ─── Actions ─────────────────────────────────────────────────────────────────

type Action =
    | { type: 'AUTH_INIT_DONE'; user: UserProfile | null }
    | { type: 'SET_LOADING'; loading: boolean }
    | { type: 'SET_ERROR'; error: string | null }
    | { type: 'OPEN_MODAL'; view: ModalView }
    | { type: 'CLOSE_MODAL' }
    | { type: 'SET_VIEW'; view: ModalView }
    | { type: 'SET_PENDING_EMAIL'; email: string | null }
    | { type: 'SET_SESSION_EXPIRED'; open: boolean }
    | { type: 'SIGN_OUT' }

function reducer(state: AuthState, action: Action): AuthState {
    switch (action.type) {
        case 'AUTH_INIT_DONE':
            return {
                ...state,
                status: action.user ? 'authenticated' : 'guest',
                user: action.user,
            }
        case 'SET_LOADING':
            return { ...state, nativeAuthLoading: action.loading, nativeAuthError: action.loading ? null : state.nativeAuthError }
        case 'SET_ERROR':
            return { ...state, nativeAuthError: action.error, nativeAuthLoading: false }
        case 'OPEN_MODAL':
            return {
                ...state,
                nativeAuthModalOpen: true,
                nativeAuthModalView: action.view,
                nativeAuthError: null,
            }
        case 'CLOSE_MODAL':
            return {
                ...state,
                nativeAuthModalOpen: false,
                nativeAuthError: null,
                pendingConfirmEmail: null,
            }
        case 'SET_VIEW':
            return { ...state, nativeAuthModalView: action.view, nativeAuthError: null }
        case 'SET_PENDING_EMAIL':
            return { ...state, pendingConfirmEmail: action.email }
        case 'SET_SESSION_EXPIRED':
            return { ...state, sessionExpiredModalOpen: action.open }
        case 'SIGN_OUT':
            return { ...state, status: 'guest', user: null }
        default:
            return state
    }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface AuthContextValue extends AuthState {
    openSignInModal(): void
    openSignUpModal(): void
    closeNativeAuthModal(): void
    setModalView(view: ModalView): void
    submitSignIn(email: string, password: string): Promise<void>
    submitSignUp(email: string, password: string, displayName: string): Promise<void>
    submitConfirmEmail(email: string, code: string): Promise<void>
    resendConfirmCode(email: string): Promise<void>
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
    const [state, dispatch] = useReducer(reducer, initialState)
    const router = useRouter()
    const pathname = usePathname()

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
            (err) => {
                if (cancelled) return
                if (err instanceof AuthUnauthenticatedError) {
                    dispatch({ type: 'AUTH_INIT_DONE', user: null })
                } else {
                    dispatch({ type: 'AUTH_INIT_DONE', user: null })
                }
            }
        )
        return () => { cancelled = true }
    }, [])

    // Install token refresh interceptor
    useEffect(() => {
        installAuthInterceptor(() => dispatch({ type: 'SET_SESSION_EXPIRED', open: true }))
        return () => uninstallAuthInterceptor()
    }, [])

    const openSignInModal = useCallback(() => dispatch({ type: 'OPEN_MODAL', view: 'signIn' }), [])
    const openSignUpModal = useCallback(() => dispatch({ type: 'OPEN_MODAL', view: 'signUp' }), [])
    const closeNativeAuthModal = useCallback(() => dispatch({ type: 'CLOSE_MODAL' }), [])
    const setModalView = useCallback((view: ModalView) => dispatch({ type: 'SET_VIEW', view }), [])
    const closeSessionExpiredModal = useCallback(() => dispatch({ type: 'SET_SESSION_EXPIRED', open: false }), [])

    const submitSignIn = useCallback(async (email: string, password: string) => {
        dispatch({ type: 'SET_LOADING', loading: true })
        try {
            await authApiClient.signIn(email, password)
            const user = await authApiClient.getMe()
            dispatch({ type: 'AUTH_INIT_DONE', user })
            dispatch({ type: 'CLOSE_MODAL' })
            router.refresh()
        } catch (err) {
            const key = err instanceof AuthNativeError
                ? mapNativeAuthError(err.code)
                : 'auth:errors.network'
            dispatch({ type: 'SET_ERROR', error: key })
        } finally {
            dispatch({ type: 'SET_LOADING', loading: false })
        }
    }, [router])

    const submitSignUp = useCallback(async (email: string, password: string, displayName: string) => {
        dispatch({ type: 'SET_LOADING', loading: true })
        try {
            const res = await authApiClient.signUp(email, password, displayName)
            if (res.confirmationRequired) {
                dispatch({ type: 'SET_PENDING_EMAIL', email })
                dispatch({ type: 'SET_VIEW', view: 'confirmEmail' })
            } else {
                const user = await authApiClient.getMe()
                dispatch({ type: 'AUTH_INIT_DONE', user })
                dispatch({ type: 'CLOSE_MODAL' })
                router.refresh()
            }
        } catch (err) {
            const key = err instanceof AuthNativeError
                ? mapNativeAuthError(err.code)
                : 'auth:errors.network'
            dispatch({ type: 'SET_ERROR', error: key })
        } finally {
            dispatch({ type: 'SET_LOADING', loading: false })
        }
    }, [router])

    const submitConfirmEmail = useCallback(async (email: string, code: string) => {
        dispatch({ type: 'SET_LOADING', loading: true })
        try {
            await authApiClient.confirmSignUp(email, code)
            dispatch({ type: 'SET_PENDING_EMAIL', email: null })
            dispatch({ type: 'SET_VIEW', view: 'signIn' })
        } catch (err) {
            const key = err instanceof AuthNativeError
                ? mapNativeAuthError(err.code)
                : 'auth:errors.network'
            dispatch({ type: 'SET_ERROR', error: key })
        } finally {
            dispatch({ type: 'SET_LOADING', loading: false })
        }
    }, [])

    const resendConfirmCode = useCallback(async (email: string) => {
        dispatch({ type: 'SET_LOADING', loading: true })
        try {
            await authApiClient.resendCode(email)
        } catch {
            // best effort — don't surface error for resend
        } finally {
            dispatch({ type: 'SET_LOADING', loading: false })
        }
    }, [])

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
        signOut,
        closeSessionExpiredModal,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
