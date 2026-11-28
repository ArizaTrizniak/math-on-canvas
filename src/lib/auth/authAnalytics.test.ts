import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const track = vi.fn()
const syncInternalFromRole = vi.fn()
vi.mock('@/common/analytics/track', () => ({ track: (...args: unknown[]) => track(...args) }))
vi.mock('@/common/utils/analytics', () => ({
    syncInternalFromRole: (...args: unknown[]) => syncInternalFromRole(...args),
}))

import {
    loginFailureReason,
    recordAuthTrigger,
    settleAuthInit,
    signUpFailureReason,
    trackAuthPromptOpened,
    trackAuthSuccess,
} from './authAnalytics'
import { AuthNativeError, AuthNetworkError, type UserProfile } from './authTypes'

const TRIGGER_KEY = 'moc_last_auth_trigger'

const createMemoryStorage = (): Storage => {
    const data = new Map<string, string>()
    return {
        get length() { return data.size },
        clear: () => data.clear(),
        getItem: (key) => data.get(key) ?? null,
        key: (index) => [...data.keys()][index] ?? null,
        removeItem: (key) => { data.delete(key) },
        setItem: (key, value) => { data.set(key, String(value)) },
    }
}

const profile = (role: UserProfile['role']): UserProfile => ({
    userId: 'usr_1',
    email: 'a@example.com',
    displayName: 'A',
    role,
    entitlements: { products: [], aiCredits: null, plan: null },
})

const nativeError = (code: string) => new AuthNativeError('x', code)

beforeEach(() => {
    track.mockClear()
    syncInternalFromRole.mockClear()
    vi.stubGlobal('sessionStorage', createMemoryStorage())
})

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('loginFailureReason', () => {
    it.each([
        ['unauthorized', 'invalid_credentials'],
        ['user_not_confirmed', 'not_confirmed'],
        ['rate_limit_exceeded', 'rate_limited'],
        ['something_else', 'other'],
    ])('maps %s to %s', (code, reason) => {
        expect(loginFailureReason(nativeError(code))).toBe(reason)
    })

    it('maps a network failure to network', () => {
        expect(loginFailureReason(new AuthNetworkError())).toBe('network')
    })
})

describe('signUpFailureReason', () => {
    it.each([
        ['email_already_exists', 'email_exists'],
        ['password_too_weak', 'weak_password'],
        ['invalid_confirmation_code', 'invalid_code'],
        ['rate_limit_exceeded', 'rate_limited'],
        ['something_else', 'other'],
    ])('maps %s to %s', (code, reason) => {
        expect(signUpFailureReason(nativeError(code))).toBe(reason)
    })

    it('maps a network failure to network', () => {
        expect(signUpFailureReason(new AuthNetworkError())).toBe('network')
    })
})

describe('prompt opening', () => {
    it('trackAuthPromptOpened sends auth_modal_opened with the GA4 view name', () => {
        trackAuthPromptOpened('signUp', 'pricing')
        expect(track).toHaveBeenCalledWith({ name: 'auth_modal_opened', view: 'sign_up', trigger: 'pricing' })

        trackAuthPromptOpened('signIn', 'landing')
        expect(track).toHaveBeenCalledWith({ name: 'auth_modal_opened', view: 'sign_in', trigger: 'landing' })
    })

    it('recordAuthTrigger only stores the trigger', () => {
        recordAuthTrigger('catalog')

        expect(sessionStorage.getItem(TRIGGER_KEY)).toBe('catalog')
        expect(track).not.toHaveBeenCalled()
    })
})

describe('trackAuthSuccess', () => {
    it('marks an admin internal before sending login with the stored trigger', () => {
        recordAuthTrigger('landing')

        trackAuthSuccess(['login'], 'email', profile('admin'))

        expect(syncInternalFromRole).toHaveBeenCalledWith('admin')
        expect(track).toHaveBeenCalledWith({ name: 'login', method: 'email', trigger: 'landing' })
        expect(syncInternalFromRole.mock.invocationCallOrder[0]).toBeLessThan(track.mock.invocationCallOrder[0])
        expect(sessionStorage.getItem(TRIGGER_KEY)).toBeNull()
    })

    it('still sends login when the profile could not be loaded', () => {
        trackAuthSuccess(['login'], 'email', null)

        expect(syncInternalFromRole).toHaveBeenCalledWith(undefined)
        expect(track).toHaveBeenCalledWith({ name: 'login', method: 'email', trigger: undefined })
    })

    it('with no events (password reset) sends nothing but uses up the trigger', () => {
        recordAuthTrigger('landing')

        trackAuthSuccess([], 'email', profile('free_user'))

        expect(track).not.toHaveBeenCalled()
        expect(sessionStorage.getItem(TRIGGER_KEY)).toBeNull()
    })
})

describe('settleAuthInit', () => {
    it('user + signup marker → sign_up then login, both with the stored trigger', () => {
        recordAuthTrigger('pricing')

        settleAuthInit({ result: 'signup', error: null }, profile('free_user'))

        expect(track.mock.calls).toEqual([
            [{ name: 'sign_up', method: 'google', trigger: 'pricing' }],
            [{ name: 'login', method: 'google', trigger: 'pricing' }],
        ])
    })

    it('user + login marker → login only', () => {
        recordAuthTrigger('landing')

        settleAuthInit({ result: 'login', error: null }, profile('free_user'))

        expect(track.mock.calls).toEqual([[{ name: 'login', method: 'google', trigger: 'landing' }]])
    })

    it('user without a marker (ordinary load) → nothing sent, stale trigger cleared', () => {
        recordAuthTrigger('landing')

        settleAuthInit({ result: null, error: null }, profile('free_user'))

        expect(track).not.toHaveBeenCalled()
        expect(sessionStorage.getItem(TRIGGER_KEY)).toBeNull()
    })

    it('no user + OAuth error → nothing sent, trigger kept for the retry', () => {
        recordAuthTrigger('landing')

        settleAuthInit({ result: null, error: 'access_denied' }, null)

        expect(track).not.toHaveBeenCalled()
        expect(sessionStorage.getItem(TRIGGER_KEY)).toBe('landing')
    })

    it('no user and no error → nothing sent, trigger cleared', () => {
        recordAuthTrigger('landing')

        settleAuthInit({ result: 'login', error: null }, null)

        expect(track).not.toHaveBeenCalled()
        expect(sessionStorage.getItem(TRIGGER_KEY)).toBeNull()
    })
})
