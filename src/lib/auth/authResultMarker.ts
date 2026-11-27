/**
 * After Google OAuth the auth backend redirects back with `?auth_result=login|signup`
 * (BL-0009) so the site can tell a fresh sign-in — and a brand-new account — from an
 * ordinary page load with a live session. Copy of the editor's `authResultMarker.ts`.
 */

export type AuthResultMarker = 'login' | 'signup'

const PARAM = 'auth_result'
const VALUES: readonly string[] = ['login', 'signup']

/**
 * Reads the marker and removes it from the URL straight away, so a reload or a
 * shared link never reports the same sign-in twice. Unknown values are removed
 * too but not trusted.
 */
export function consumeAuthResultMarker(): AuthResultMarker | null {
    if (typeof window === 'undefined') return null
    const url = new URL(window.location.href)
    const value = url.searchParams.get(PARAM)
    if (value === null) return null

    url.searchParams.delete(PARAM)
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
    return VALUES.includes(value) ? value as AuthResultMarker : null
}
