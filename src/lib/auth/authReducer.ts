import type { UserProfile } from './authTypes'

export type AuthStatus = 'loading' | 'authenticated' | 'guest'

export type ModalView =
    | 'signIn'
    | 'signUp'
    | 'confirmEmail'
    | 'forgotPassword'
    | 'resetPassword'
    | 'resetDone'

export interface AuthModalContext {
    kind: 'catalogOpen'
    title: string
    thumbnailUrl: string | null
    intro: string
}

export interface AuthState {
    status: AuthStatus
    user: UserProfile | null
    nativeAuthModalOpen: boolean
    nativeAuthModalView: ModalView
    nativeAuthLoading: boolean
    /** i18n key of the current error, shown as a banner. */
    nativeAuthError: string | null
    /** i18n key of a neutral status message ("code sent again"). */
    nativeAuthNotice: string | null
    /** Email carried between views so the user never types it twice. */
    prefillEmail: string | null
    pendingConfirmEmail: string | null
    pendingResetEmail: string | null
    /** Whether the backend signed the user in after a password reset. */
    resetSignedIn: boolean
    sessionExpiredModalOpen: boolean
    modalContext: AuthModalContext | null
}

export const initialAuthState: AuthState = {
    status: 'loading',
    user: null,
    nativeAuthModalOpen: false,
    nativeAuthModalView: 'signIn',
    nativeAuthLoading: false,
    nativeAuthError: null,
    nativeAuthNotice: null,
    prefillEmail: null,
    pendingConfirmEmail: null,
    pendingResetEmail: null,
    resetSignedIn: false,
    sessionExpiredModalOpen: false,
    modalContext: null,
}

export type AuthAction =
    | { type: 'AUTH_INIT_DONE'; user: UserProfile | null }
    | { type: 'SET_LOADING'; loading: boolean }
    | { type: 'SET_ERROR'; error: string | null }
    | { type: 'SET_NOTICE'; notice: string | null }
    | { type: 'OPEN_MODAL'; view: ModalView; context?: AuthModalContext | null }
    | { type: 'CLOSE_MODAL' }
    | { type: 'SET_VIEW'; view: ModalView; prefillEmail?: string }
    | { type: 'SET_PENDING_EMAIL'; email: string | null }
    | { type: 'RESET_CODE_SENT'; email: string }
    | { type: 'RESET_DONE'; signedIn: boolean }
    | { type: 'SET_SESSION_EXPIRED'; open: boolean }
    | { type: 'SIGN_OUT' }

const clearedFlow = {
    nativeAuthError: null,
    nativeAuthNotice: null,
    prefillEmail: null,
    pendingConfirmEmail: null,
    pendingResetEmail: null,
    resetSignedIn: false,
} satisfies Partial<AuthState>

export function authReducer(state: AuthState, action: AuthAction): AuthState {
    switch (action.type) {
        case 'AUTH_INIT_DONE':
            return { ...state, status: action.user ? 'authenticated' : 'guest', user: action.user }
        case 'SET_LOADING':
            return action.loading
                ? { ...state, nativeAuthLoading: true, nativeAuthError: null, nativeAuthNotice: null }
                : { ...state, nativeAuthLoading: false }
        case 'SET_ERROR':
            return { ...state, nativeAuthError: action.error, nativeAuthLoading: false }
        case 'SET_NOTICE':
            return { ...state, nativeAuthNotice: action.notice, nativeAuthError: null }
        case 'OPEN_MODAL':
            return {
                ...state,
                ...clearedFlow,
                nativeAuthModalOpen: true,
                nativeAuthModalView: action.view,
                modalContext: action.context ?? null,
            }
        case 'CLOSE_MODAL':
            return { ...state, ...clearedFlow, nativeAuthModalOpen: false, modalContext: null }
        case 'SET_VIEW':
            return {
                ...state,
                nativeAuthModalView: action.view,
                nativeAuthError: null,
                nativeAuthNotice: null,
                prefillEmail: action.prefillEmail ?? state.prefillEmail,
            }
        case 'SET_PENDING_EMAIL':
            return { ...state, pendingConfirmEmail: action.email }
        case 'RESET_CODE_SENT':
            return {
                ...state,
                nativeAuthModalView: 'resetPassword',
                nativeAuthError: null,
                pendingResetEmail: action.email,
                prefillEmail: action.email,
            }
        case 'RESET_DONE':
            return {
                ...state,
                nativeAuthModalView: 'resetDone',
                nativeAuthError: null,
                nativeAuthNotice: null,
                resetSignedIn: action.signedIn,
                prefillEmail: state.pendingResetEmail ?? state.prefillEmail,
                pendingResetEmail: null,
            }
        case 'SET_SESSION_EXPIRED':
            return { ...state, sessionExpiredModalOpen: action.open }
        case 'SIGN_OUT':
            return { ...state, status: 'guest', user: null }
        default:
            return state
    }
}
