import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { buildGoogleSignInUrl, startGoogleSignIn } from './googleSignIn'

describe('buildGoogleSignInUrl', () => {
    it('points to /auth/login with the current page as redirect_uri', () => {
        const url = buildGoogleSignInUrl('https://auth.example.com', 'https://app.example.com', '/ru/catalog')
        expect(url).toBe('https://auth.example.com/auth/login?redirect_uri=https%3A%2F%2Fapp.example.com%2Fru%2Fcatalog')
    })
})

describe('startGoogleSignIn', () => {
    const memory = () => {
        const data = new Map<string, string>()
        return {
            getItem: (key: string) => data.get(key) ?? null,
            setItem: (key: string, value: string) => { data.set(key, value) },
            removeItem: (key: string) => { data.delete(key) },
        }
    }

    beforeEach(() => {
        vi.stubGlobal('sessionStorage', memory())
        vi.stubEnv('NEXT_PUBLIC_AUTH_API_URL', 'https://auth.example.com')
        vi.stubGlobal('window', {
            location: { origin: 'https://www.math-on-canvas.com', pathname: '/en', href: '' },
        })
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.unstubAllEnvs()
    })

    it('records the trigger before leaving for Google', () => {
        startGoogleSignIn('landing')

        expect(sessionStorage.getItem('moc_last_auth_trigger')).toBe('landing')
        expect(window.location.href).toContain('/auth/login?redirect_uri=')
    })

    it('without a trigger leaves the stored one alone', () => {
        sessionStorage.setItem('moc_last_auth_trigger', 'pricing')

        startGoogleSignIn()

        expect(sessionStorage.getItem('moc_last_auth_trigger')).toBe('pricing')
    })
})
