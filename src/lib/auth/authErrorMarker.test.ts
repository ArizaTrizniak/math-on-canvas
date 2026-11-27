import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { consumeAuthErrorMarker, mapOAuthErrorToBanner } from './authErrorMarker'
import { authReducer, initialAuthState } from './authReducer'

describe('consumeAuthErrorMarker', () => {
    const originalWindow = globalThis.window

    beforeEach(() => {
        const state = { href: 'https://www.math-on-canvas.com/en' }
        const replaceState = (_s: unknown, _t: string, url: string) => {
            state.href = new URL(url, 'https://www.math-on-canvas.com').toString()
        }
        Object.defineProperty(globalThis, 'window', {
            configurable: true,
            value: {
                get location() { return new URL(state.href) },
                history: { state: null, replaceState },
            },
        })
    })

    afterEach(() => {
        Object.defineProperty(globalThis, 'window', {
            configurable: true,
            value: originalWindow,
        })
    })

    it('returns null when auth_error is absent', () => {
        expect(consumeAuthErrorMarker()).toBeNull()
    })

    it.each(['access_denied', 'state_missing', 'state_expired', 'oauth_failed'] as const)(
        'reads %s and removes auth_error while keeping other query params',
        (code) => {
            window.history.replaceState(null, '', `/ru?foo=1&auth_error=${code}#sec`)
            expect(consumeAuthErrorMarker()).toBe(code)
            expect(window.location.pathname).toBe('/ru')
            expect(window.location.search).toBe('?foo=1')
            expect(window.location.hash).toBe('#sec')
        },
    )

    it('degrades unknown non-empty values to oauth_failed', () => {
        window.history.replaceState(null, '', '/en?auth_error=unexpected_code')
        expect(consumeAuthErrorMarker()).toBe('oauth_failed')
        expect(window.location.search).toBe('')
    })
})

describe('mapOAuthErrorToBanner & authReducer OPEN_OAUTH_ERROR', () => {
    it('maps access_denied to neutral notice and errors to error banner', () => {
        expect(mapOAuthErrorToBanner('access_denied')).toEqual({
            error: null,
            notice: 'auth:notice.oauthCancelled',
        })
        expect(mapOAuthErrorToBanner('state_missing')).toEqual({
            error: 'auth:errors.oauthCookiesOrTimeout',
            notice: null,
        })
        expect(mapOAuthErrorToBanner('state_expired')).toEqual({
            error: 'auth:errors.oauthExpired',
            notice: null,
        })
        expect(mapOAuthErrorToBanner('oauth_failed')).toEqual({
            error: 'auth:errors.oauthFailed',
            notice: null,
        })
    })

    it('opens signIn modal with error banner on OPEN_OAUTH_ERROR', () => {
        const next = authReducer(initialAuthState, {
            type: 'OPEN_OAUTH_ERROR',
            error: 'auth:errors.oauthCookiesOrTimeout',
            notice: null,
        })
        expect(next.nativeAuthModalOpen).toBe(true)
        expect(next.nativeAuthModalView).toBe('signIn')
        expect(next.nativeAuthError).toBe('auth:errors.oauthCookiesOrTimeout')
        expect(next.nativeAuthNotice).toBeNull()
    })
})
