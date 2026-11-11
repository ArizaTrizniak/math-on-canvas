import { describe, it, expect, vi, afterEach } from 'vitest'
import { installAuthInterceptor, uninstallAuthInterceptor } from './authInterceptor'

afterEach(() => {
    uninstallAuthInterceptor()
    vi.unstubAllGlobals()
})

function install401Fetch() {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: false, status: 401 } as Response))
    vi.stubGlobal('fetch', fetchMock)
    const onExpired = vi.fn()
    installAuthInterceptor(onExpired)
    return { fetchMock, onExpired }
}

describe('authInterceptor skip list', () => {
    it.each([
        '/auth/signin',
        '/auth/signup',
        '/auth/confirm-signup',
        '/auth/resend-code',
        '/auth/forgot-password',
        '/auth/reset-password',
    ])('does not try to refresh or show "session expired" for %s', async (path) => {
        const { fetchMock, onExpired } = install401Fetch()

        const res = await globalThis.fetch(`https://auth.example.com${path}`, { method: 'POST' })

        expect(res.status).toBe(401)
        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(onExpired).not.toHaveBeenCalled()
    })

    it('still refreshes for other endpoints', async () => {
        const { fetchMock, onExpired } = install401Fetch()

        await globalThis.fetch('https://auth.example.com/auth/me').catch(() => {})

        expect(fetchMock).toHaveBeenCalledTimes(2)
        expect(onExpired).toHaveBeenCalledTimes(1)
    })
})
