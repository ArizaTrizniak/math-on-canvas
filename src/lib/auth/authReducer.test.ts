import { describe, it, expect } from 'vitest'
import { authReducer, initialAuthState, type AuthState } from './authReducer'

const open = (overrides: Partial<AuthState> = {}): AuthState => ({
    ...initialAuthState,
    nativeAuthModalOpen: true,
    ...overrides,
})

describe('authReducer — modal navigation', () => {
    it('SET_VIEW carries an email to prefill and clears error and notice', () => {
        const s = authReducer(
            open({ nativeAuthError: 'auth:errors.unknown', nativeAuthNotice: 'auth:notice.codeResent' }),
            { type: 'SET_VIEW', view: 'forgotPassword', prefillEmail: 'anna@school.ru' },
        )
        expect(s.nativeAuthModalView).toBe('forgotPassword')
        expect(s.prefillEmail).toBe('anna@school.ru')
        expect(s.nativeAuthError).toBeNull()
        expect(s.nativeAuthNotice).toBeNull()
    })

    it('SET_VIEW without prefillEmail keeps the previous one', () => {
        const s = authReducer(open({ prefillEmail: 'a@b.ru' }), { type: 'SET_VIEW', view: 'signIn' })
        expect(s.prefillEmail).toBe('a@b.ru')
    })

    it('CLOSE_MODAL forgets every pending email and the reset outcome', () => {
        const s = authReducer(
            open({ prefillEmail: 'a@b.ru', pendingConfirmEmail: 'a@b.ru', pendingResetEmail: 'a@b.ru', resetSignedIn: true }),
            { type: 'CLOSE_MODAL' },
        )
        expect(s.nativeAuthModalOpen).toBe(false)
        expect(s.prefillEmail).toBeNull()
        expect(s.pendingConfirmEmail).toBeNull()
        expect(s.pendingResetEmail).toBeNull()
        expect(s.resetSignedIn).toBe(false)
    })

    it('OPEN_MODAL starts clean even if a previous flow left state behind', () => {
        const s = authReducer(
            { ...initialAuthState, pendingResetEmail: 'a@b.ru', nativeAuthNotice: 'x' },
            { type: 'OPEN_MODAL', view: 'signIn' },
        )
        expect(s.pendingResetEmail).toBeNull()
        expect(s.nativeAuthNotice).toBeNull()
        expect(s.nativeAuthModalView).toBe('signIn')
    })
})

describe('authReducer — password reset flow', () => {
    it('RESET_CODE_SENT moves to resetPassword and remembers the email', () => {
        const s = authReducer(open({ nativeAuthModalView: 'forgotPassword' }), { type: 'RESET_CODE_SENT', email: 'anna@school.ru' })
        expect(s.nativeAuthModalView).toBe('resetPassword')
        expect(s.pendingResetEmail).toBe('anna@school.ru')
        expect(s.prefillEmail).toBe('anna@school.ru')
    })

    it('RESET_DONE moves to resetDone with the sign-in outcome', () => {
        const s = authReducer(
            open({ nativeAuthModalView: 'resetPassword', pendingResetEmail: 'a@b.ru' }),
            { type: 'RESET_DONE', signedIn: false },
        )
        expect(s.nativeAuthModalView).toBe('resetDone')
        expect(s.resetSignedIn).toBe(false)
        expect(s.pendingResetEmail).toBeNull()
        expect(s.prefillEmail).toBe('a@b.ru')
    })
})

describe('authReducer — loading, errors, notices', () => {
    it('starting a request clears error and notice', () => {
        const s = authReducer(open({ nativeAuthError: 'e', nativeAuthNotice: 'n' }), { type: 'SET_LOADING', loading: true })
        expect(s.nativeAuthLoading).toBe(true)
        expect(s.nativeAuthError).toBeNull()
        expect(s.nativeAuthNotice).toBeNull()
    })

    it('SET_NOTICE shows a status message and clears the error', () => {
        const s = authReducer(open({ nativeAuthError: 'e' }), { type: 'SET_NOTICE', notice: 'auth:notice.codeResent' })
        expect(s.nativeAuthNotice).toBe('auth:notice.codeResent')
        expect(s.nativeAuthError).toBeNull()
    })

    it('SET_ERROR stops loading', () => {
        const s = authReducer(open({ nativeAuthLoading: true }), { type: 'SET_ERROR', error: 'auth:errors.invalidCode' })
        expect(s.nativeAuthLoading).toBe(false)
        expect(s.nativeAuthError).toBe('auth:errors.invalidCode')
    })
})

describe('authReducer — auth trigger tracking', () => {
    const user = {
        userId: 'u1',
        email: 'a@b.ru',
        displayName: 'A',
        role: 'free_user' as const,
        entitlements: { products: [], aiCredits: null, plan: null },
    }

    it('AUTH_INIT_DONE stores lastAuthTrigger for authenticated users and clears it for guests', () => {
        const authed = authReducer(initialAuthState, { type: 'AUTH_INIT_DONE', user, authTrigger: 'catalog' })
        expect(authed.status).toBe('authenticated')
        expect(authed.lastAuthTrigger).toBe('catalog')

        const withoutTrigger = authReducer(authed, { type: 'AUTH_INIT_DONE', user })
        expect(withoutTrigger.lastAuthTrigger).toBeNull()

        const guest = authReducer(authed, { type: 'AUTH_INIT_DONE', user: null, authTrigger: 'catalog' })
        expect(guest.status).toBe('guest')
        expect(guest.lastAuthTrigger).toBeNull()
    })

    it('SIGN_OUT clears lastAuthTrigger', () => {
        const authed = authReducer(initialAuthState, { type: 'AUTH_INIT_DONE', user, authTrigger: 'catalog' })
        const signedOut = authReducer(authed, { type: 'SIGN_OUT' })
        expect(signedOut.status).toBe('guest')
        expect(signedOut.lastAuthTrigger).toBeNull()
    })
})
