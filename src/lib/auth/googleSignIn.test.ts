import { describe, it, expect } from 'vitest'
import { buildGoogleSignInUrl } from './googleSignIn'

describe('buildGoogleSignInUrl', () => {
    it('points to /auth/login with the current page as redirect_uri', () => {
        const url = buildGoogleSignInUrl('https://auth.example.com', 'https://app.example.com', '/ru/catalog')
        expect(url).toBe('https://auth.example.com/auth/login?redirect_uri=https%3A%2F%2Fapp.example.com%2Fru%2Fcatalog')
    })
})
