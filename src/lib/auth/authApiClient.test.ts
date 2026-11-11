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
describe('authApiClient password reset', () => {
    function captureFetch(status: number, body: unknown) {
        const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(() => Promise.resolve({
            ok: status >= 200 && status < 300,
            status,
            json: () => Promise.resolve(body),
        } as Response))
        vi.stubGlobal('fetch', fetchMock)
        return fetchMock
    }

    it('forgotPassword POSTs email and lang to /auth/forgot-password', async () => {
        const fetchMock = captureFetch(200, { sent: true })

        const res = await authApiClient.forgotPassword('anna@school.ru', 'ru')

        expect(res).toEqual({ sent: true })
        const [url, init] = fetchMock.mock.calls[0]
        expect(url).toMatch(/\/auth\/forgot-password$/)
        expect(init?.method).toBe('POST')
        expect(init?.credentials).toBe('include')
        expect(JSON.parse(init?.body as string)).toEqual({ email: 'anna@school.ru', lang: 'ru' })
    })

    it('resetPassword POSTs email, code and newPassword and returns signedIn', async () => {
        const fetchMock = captureFetch(200, { success: true, signedIn: true })

        const res = await authApiClient.resetPassword('anna@school.ru', '730926', 'Kvadrat-2026')

        expect(res).toEqual({ success: true, signedIn: true })
        const [url, init] = fetchMock.mock.calls[0]
        expect(url).toMatch(/\/auth\/reset-password$/)
        expect(JSON.parse(init?.body as string)).toEqual({
            email: 'anna@school.ru', code: '730926', newPassword: 'Kvadrat-2026',
        })
    })

    it('resetPassword surfaces invalid_confirmation_code as AuthNativeError', async () => {
        captureFetch(400, { error: 'invalid_confirmation_code', message: 'bad', request_id: 'r' })

        const err = await authApiClient.resetPassword('a@b.ru', '000000', 'Kvadrat-2026').catch((e) => e)

        expect(err).toBeInstanceOf(AuthNativeError)
        expect((err as AuthNativeError).code).toBe('invalid_confirmation_code')
    })
})
