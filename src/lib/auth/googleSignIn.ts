import type { AuthModalTrigger } from '@/common/analytics/events'
import { writePendingAuthSession } from './pendingAuthAction'

export function buildGoogleSignInUrl(apiBase: string, origin: string, pathname: string): string {
    const url = new URL(`${apiBase}/auth/login`)
    url.searchParams.set('redirect_uri', origin + pathname)
    return url.toString()
}

/**
 * Full-page redirect into the Google OAuth flow; returns to the current page.
 * `trigger` is kept across the redirect for the `login` / `sign_up` event; without it the
 * trigger already recorded when the prompt opened stays as is.
 */
export function startGoogleSignIn(trigger?: AuthModalTrigger): void {
    if (trigger) writePendingAuthSession(trigger)
    window.location.href = buildGoogleSignInUrl(
        process.env.NEXT_PUBLIC_AUTH_API_URL ?? '',
        window.location.origin,
        window.location.pathname,
    )
}
