/**
 * What the site sends to GA4 around sign-in and sign-up (BL-0009). Kept apart from
 * authContext so every decision is testable without React. Mirrors the editor:
 * `login` / `sign_up` fire on the backend's answer, after the internal-traffic flag.
 */
import type {
    AuthMethod,
    AuthModalTrigger,
    LoginFailureReason,
    SignUpFailureReason,
} from '@/common/analytics/events'
import { track } from '@/common/analytics/track'
import { syncInternalFromRole } from '@/common/utils/analytics'
import type { AuthErrorMarker } from './authErrorMarker'
import type { AuthResultMarker } from './authResultMarker'
import { AuthNativeError, type UserProfile } from './authTypes'
import { clearPendingAuthSession, consumeLastAuthTrigger, writePendingAuthSession } from './pendingAuthAction'

export function loginFailureReason(err: unknown): LoginFailureReason {
    if (!(err instanceof AuthNativeError)) return 'network'
    switch (err.code) {
        case 'unauthorized': return 'invalid_credentials'
        case 'user_not_confirmed': return 'not_confirmed'
        case 'rate_limit_exceeded': return 'rate_limited'
        default: return 'other'
    }
}

export function signUpFailureReason(err: unknown): SignUpFailureReason {
    if (!(err instanceof AuthNativeError)) return 'network'
    switch (err.code) {
        case 'email_already_exists': return 'email_exists'
        case 'password_too_weak': return 'weak_password'
        case 'invalid_confirmation_code': return 'invalid_code'
        case 'rate_limit_exceeded': return 'rate_limited'
        default: return 'other'
    }
}

/** One event per shown prompt: the dropdown menu or a modal opened directly. */
export function trackAuthPromptOpened(view: 'signIn' | 'signUp', trigger: AuthModalTrigger): void {
    track({ name: 'auth_modal_opened', view: view === 'signIn' ? 'sign_in' : 'sign_up', trigger })
}

/** Keeps the trigger for `login` / `sign_up`, including across the Google redirect. */
export function recordAuthTrigger(trigger: AuthModalTrigger): void {
    writePendingAuthSession(trigger)
}

/**
 * Sends `login` / `sign_up` after a successful sign-in. The trigger is used up even when
 * no event is sent (password reset), and the admin flag is set first so the events of an
 * admin's first sign-in on a clean browser already count as internal traffic.
 */
export function trackAuthSuccess(
    events: readonly ('sign_up' | 'login')[],
    method: AuthMethod,
    user: UserProfile | null,
): AuthModalTrigger | null {
    const trigger = consumeLastAuthTrigger()
    syncInternalFromRole(user?.role)
    for (const name of events) {
        track({ name, method, trigger: trigger ?? undefined })
    }
    return trigger
}

/** Settles the OAuth markers read on page load once the session check is done. */
export function settleAuthInit(
    markers: { result: AuthResultMarker | null; error: AuthErrorMarker | null },
    user: UserProfile | null,
): AuthModalTrigger | null {
    if (user) {
        if (markers.result === 'signup') return trackAuthSuccess(['sign_up', 'login'], 'google', user)
        if (markers.result === 'login') return trackAuthSuccess(['login'], 'google', user)
        clearPendingAuthSession()
        return null
    }
    // A failed Google attempt keeps the trigger: the user usually retries from the banner.
    if (markers.error) return null
    clearPendingAuthSession()
    return null
}
