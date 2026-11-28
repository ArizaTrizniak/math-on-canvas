/**
 * Typed analytics events of the site. A copy of the editor's `src/analytics/events.ts`
 * (math_poster_editor): the site and the editor write to the same GA4 property from the
 * same origin, so event names, params and allowed values must match (BL-0009).
 * Only the trigger list differs between the two apps.
 */
import type { LanguageCode } from '@/lib/i18n/constants'

/** Where the sign-in prompt (menu or modal) was opened from. */
export const AUTH_MODAL_TRIGGERS = ['landing', 'pricing', 'catalog', 'session_expired'] as const
export type AuthModalTrigger = (typeof AUTH_MODAL_TRIGGERS)[number]

export type AuthMethod = 'email' | 'google'
export type AuthModalViewProp = 'sign_in' | 'sign_up'
export type LoginFailureReason = 'invalid_credentials' | 'not_confirmed' | 'rate_limited' | 'network' | 'other'
export type SignUpStep = 'submit' | 'confirm'
export type SignUpFailureReason = 'email_exists' | 'weak_password' | 'invalid_code' | 'rate_limited' | 'network' | 'other'
export type CtaLocation = 'landing' | 'header' | 'hero' | 'catalog-header'

export type AnalyticsEvent =
    // Sign-in / sign-up funnel. `login` and `sign_up` are GA4 recommended event names;
    // they fire on the backend's answer, never on a click. Same names as in the editor.
    | { name: 'auth_modal_opened'; view: AuthModalViewProp; trigger: AuthModalTrigger }
    | { name: 'login'; method: AuthMethod; trigger?: AuthModalTrigger }
    | { name: 'login_failed'; reason: LoginFailureReason }
    | { name: 'sign_up_submitted'; method: 'email' }
    | { name: 'sign_up_failed'; step: SignUpStep; reason: SignUpFailureReason }
    | { name: 'sign_up'; method: AuthMethod; trigger?: AuthModalTrigger }
    // Site navigation
    | { name: 'cta_click'; location: CtaLocation }
    | { name: 'language_switch'; lang: LanguageCode }
    | { name: 'sign_out' }

export type AnalyticsEventName = AnalyticsEvent['name']

/** Allowed values of every string param; the PII guard test checks each event against it. */
export const EVENT_PROP_VALUES: Record<string, readonly string[]> = {
    view: ['sign_in', 'sign_up'],
    trigger: [...AUTH_MODAL_TRIGGERS],
    method: ['email', 'google'],
    // login_failed and sign_up_failed share the GA4 `reason` dimension
    reason: ['invalid_credentials', 'not_confirmed', 'email_exists', 'weak_password', 'invalid_code', 'rate_limited', 'network', 'other'],
    step: ['submit', 'confirm'],
    location: ['landing', 'header', 'hero', 'catalog-header'],
    lang: ['en', 'es', 'de', 'ru'],
}
