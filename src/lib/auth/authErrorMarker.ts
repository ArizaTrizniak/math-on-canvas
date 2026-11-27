/**
 * Reads and removes `?auth_error=...` appended by the auth service when an
 * OAuth callback fails, so the landing site can open the sign-in modal with a
 * helpful message and reloads never replay the banner.
 */

export type AuthErrorMarker = 'access_denied' | 'state_missing' | 'state_expired' | 'oauth_failed'

const ERROR_PARAM = 'auth_error'
const ERROR_VALUES: readonly string[] = ['access_denied', 'state_missing', 'state_expired', 'oauth_failed']

export function consumeAuthErrorMarker(): AuthErrorMarker | null {
    if (typeof window === 'undefined') return null
    const url = new URL(window.location.href)
    const value = url.searchParams.get(ERROR_PARAM)
    if (value === null) return null

    url.searchParams.delete(ERROR_PARAM)
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
    if (!value) return null
    return ERROR_VALUES.includes(value) ? (value as AuthErrorMarker) : 'oauth_failed'
}

export function mapOAuthErrorToBanner(code: AuthErrorMarker): {
    error: string | null
    notice: string | null
} {
    switch (code) {
        case 'access_denied':
            return { error: null, notice: 'auth:notice.oauthCancelled' }
        case 'state_missing':
            return { error: 'auth:errors.oauthCookiesOrTimeout', notice: null }
        case 'state_expired':
            return { error: 'auth:errors.oauthExpired', notice: null }
        case 'oauth_failed':
            return { error: 'auth:errors.oauthFailed', notice: null }
    }
}
