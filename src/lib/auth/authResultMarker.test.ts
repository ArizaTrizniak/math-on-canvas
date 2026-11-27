import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { consumeAuthResultMarker } from './authResultMarker'

describe('consumeAuthResultMarker', () => {
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
        Object.defineProperty(globalThis, 'window', { configurable: true, value: originalWindow })
    })

    it('returns null when auth_result is absent', () => {
        expect(consumeAuthResultMarker()).toBeNull()
    })

    it('reads the marker once and strips it, keeping other query params and the hash', () => {
        window.history.replaceState(null, '', '/en?auth_result=signup&x=1#h')

        expect(consumeAuthResultMarker()).toBe('signup')
        expect(window.location.pathname + window.location.search + window.location.hash).toBe('/en?x=1#h')
        expect(consumeAuthResultMarker()).toBeNull()
    })

    it('reads login', () => {
        window.history.replaceState(null, '', '/ru/catalog?auth_result=login')
        expect(consumeAuthResultMarker()).toBe('login')
        expect(window.location.search).toBe('')
    })

    it('strips an unknown value without trusting it', () => {
        window.history.replaceState(null, '', '/en?auth_result=bogus')

        expect(consumeAuthResultMarker()).toBeNull()
        expect(window.location.search).toBe('')
    })
})
