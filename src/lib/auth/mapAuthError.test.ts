import { describe, it, expect } from 'vitest'
import { mapNativeAuthError } from './mapAuthError'

describe('mapNativeAuthError', () => {
    it('maps known backend codes', () => {
        expect(mapNativeAuthError('invalid_confirmation_code')).toBe('auth:errors.invalidCode')
        expect(mapNativeAuthError('password_too_weak')).toBe('auth:errors.passwordTooWeak')
        expect(mapNativeAuthError('rate_limit_exceeded')).toBe('auth:errors.rateLimited')
    })

    it('maps invalid_request to a generic "check your input" message', () => {
        expect(mapNativeAuthError('invalid_request')).toBe('auth:errors.invalidRequest')
    })

    it('maps provider_error (e.g. code delivery failure) to a delivery message', () => {
        expect(mapNativeAuthError('provider_error')).toBe('auth:errors.providerError')
    })

    it('falls back to unknown', () => {
        expect(mapNativeAuthError('whatever')).toBe('auth:errors.unknown')
    })
})
