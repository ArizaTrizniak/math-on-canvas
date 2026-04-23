import { AuthRefreshFailedError } from './authTypes'

const SKIP_PATHS = ['/auth/refresh', '/auth/signin', '/auth/logout']

let originalFetch: typeof globalThis.fetch | null = null
let installed = false
let onSessionExpiredCb: (() => void) | null = null

export function installAuthInterceptor(onSessionExpired: () => void): void {
    if (installed) return
    originalFetch = globalThis.fetch
    onSessionExpiredCb = onSessionExpired
    installed = true

    const _original = originalFetch

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url =
            typeof input === 'string'
                ? input
                : input instanceof URL
                  ? input.href
                  : (input as Request).url

        if (SKIP_PATHS.some((p) => url.includes(p))) {
            return _original(input, init)
        }

        const res = await _original(input, init)
        if (res.status !== 401) return res

        // Attempt token refresh
        const apiBase = process.env.NEXT_PUBLIC_AUTH_API_URL ?? ''
        let refreshOk = false
        try {
            const refreshRes = await _original(`${apiBase}/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
            })
            refreshOk = refreshRes.ok
        } catch {
            refreshOk = false
        }

        if (!refreshOk) {
            onSessionExpiredCb?.()
            throw new AuthRefreshFailedError()
        }

        // Retry original request once
        return _original(input, init)
    }
}

export function uninstallAuthInterceptor(): void {
    if (!installed || !originalFetch) return
    globalThis.fetch = originalFetch
    originalFetch = null
    installed = false
    onSessionExpiredCb = null
}
