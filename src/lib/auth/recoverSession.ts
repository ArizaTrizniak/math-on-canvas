import { flushAnalytics } from '@/common/utils/analytics'

/**
 * The backend accepted the credentials (cookies are set) but the profile request failed.
 * A full reload re-runs the session check, so the user lands signed in instead of on a page
 * that still shows "Sign in". The sign-in events queued just before are flushed first.
 */
export function reloadToRecoverSession(): Promise<void> {
    return flushAnalytics().then(() => window.location.reload())
}
