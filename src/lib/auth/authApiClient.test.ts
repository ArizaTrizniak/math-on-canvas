import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authApiClient } from './authApiClient'
import { AuthNativeError, AuthNetworkError, AuthUnauthenticatedError } from './authTypes'

function mockFetch(status: number, body?: unknown, throws?: Error) {
    const impl = throws
        ? () => Promise.reject(throws)
        : () => Promise.resolve({
            ok: status >= 200 && status < 300,
            status,
            json: body !== undefined
                ? () => Promise.resolve(body)
                : () => Promise.reject(new SyntaxError('No body')),
        } as Response)
    vi.stubGlobal('fetch', vi.fn(impl))
}

beforeEach(() => {
    vi.unstubAllGlobals()
})

describe('authApiClient.signIn — error parsing', () => {
    it('401 с JSON-телом {"error":"unauthorized"} → AuthNativeError с кодом unauthorized', async () => {
        mockFetch(401, {
            error: 'unauthorized',
            message: 'Incorrect email or password',
            request_id: 'c3nFPiTOIAMEb2Q=',
        })

        const err = await authApiClient.signIn('user@example.com', 'wrong').catch(e => e)

        expect(err).toBeInstanceOf(AuthNativeError)
        expect((err as AuthNativeError).code).toBe('unauthorized')
        expect((err as AuthNativeError).message).toBe('Incorrect email or password')
    })

    it('401 без JSON-тела → AuthUnauthenticatedError', async () => {
        mockFetch(401, undefined)

        const err = await authApiClient.signIn('user@example.com', 'pass').catch(e => e)

        expect(err).toBeInstanceOf(AuthUnauthenticatedError)
    })

    it('401 с JSON-телом без поля error → AuthUnauthenticatedError', async () => {
        mockFetch(401, { message: 'Unauthorized' }) // нет поля error

        const err = await authApiClient.signIn('user@example.com', 'pass').catch(e => e)

        expect(err).toBeInstanceOf(AuthUnauthenticatedError)
    })

    it('403 с JSON-телом {"error":"forbidden"} → AuthNativeError', async () => {
        mockFetch(403, { error: 'forbidden', message: 'Access denied', request_id: 'x' })

        const err = await authApiClient.signIn('user@example.com', 'pass').catch(e => e)

        expect(err).toBeInstanceOf(AuthNativeError)
        expect((err as AuthNativeError).code).toBe('forbidden')
    })

    it('403 без JSON-тела → AuthUnauthenticatedError', async () => {
        mockFetch(403, undefined)

        const err = await authApiClient.signIn('user@example.com', 'pass').catch(e => e)

        expect(err).toBeInstanceOf(AuthUnauthenticatedError)
    })

    it('429 с JSON-телом → AuthNativeError с кодом из тела', async () => {
        mockFetch(429, { error: 'rate_limit_exceeded', message: 'Too many requests', request_id: 'x' })

        const err = await authApiClient.signIn('user@example.com', 'pass').catch(e => e)

        expect(err).toBeInstanceOf(AuthNativeError)
        expect((err as AuthNativeError).code).toBe('rate_limit_exceeded')
    })

    it('500 без JSON-тела → AuthNetworkError', async () => {
        mockFetch(500, undefined)

        const err = await authApiClient.signIn('user@example.com', 'pass').catch(e => e)

        expect(err).toBeInstanceOf(AuthNetworkError)
    })

    it('сетевой сбой (fetch throws) → AuthNetworkError', async () => {
        mockFetch(0, undefined, new TypeError('Failed to fetch'))

        const err = await authApiClient.signIn('user@example.com', 'pass').catch(e => e)

        expect(err).toBeInstanceOf(AuthNetworkError)
    })

    it('200 с валидным телом → резолвится успешно', async () => {
        mockFetch(200, { success: true })

        const result = await authApiClient.signIn('user@example.com', 'correct')

        expect(result).toEqual({ success: true })
    })
})