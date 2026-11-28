import { describe, it, expect, vi, beforeEach } from 'vitest'

const trackAnalyticsEvent = vi.fn()
vi.mock('@/common/utils/analytics', () => ({
    trackAnalyticsEvent: (...args: unknown[]) => trackAnalyticsEvent(...args),
}))

import { EVENT_PROP_VALUES, type AnalyticsEvent, type AnalyticsEventName } from './events'
import { track } from './track'

/**
 * One sample per event name. `satisfies` makes a new event name fail to compile
 * until a sample is added here, so every event goes through the checks below.
 */
const SAMPLES = {
    auth_modal_opened: { name: 'auth_modal_opened', view: 'sign_up', trigger: 'pricing' },
    login: { name: 'login', method: 'google', trigger: 'landing' },
    login_failed: { name: 'login_failed', reason: 'not_confirmed' },
    sign_up_submitted: { name: 'sign_up_submitted', method: 'email' },
    sign_up_failed: { name: 'sign_up_failed', step: 'confirm', reason: 'invalid_code' },
    sign_up: { name: 'sign_up', method: 'email', trigger: 'catalog' },
    cta_click: { name: 'cta_click', location: 'catalog-header' },
    language_switch: { name: 'language_switch', lang: 'ru' },
    sign_out: { name: 'sign_out' },
} as const satisfies { [K in AnalyticsEventName]: Extract<AnalyticsEvent, { name: K }> }

const params = (event: AnalyticsEvent): Array<[string, unknown]> =>
    Object.entries(event).filter(([key]) => key !== 'name')

const SAMPLE_EVENTS = Object.values(SAMPLES) as AnalyticsEvent[]

// Same lists as the editor's tests/analytics/pii-guard.test.ts (one GA4 property for both apps).
const RESERVED = [
    'source', 'medium', 'campaign', 'term', 'content',
    'campaign_id', 'campaign_source', 'campaign_medium', 'campaign_name', 'campaign_term', 'campaign_content',
]
const BANNED = ['email', 'userId', 'displayName', 'code', 'documentId', 'doc_id', 'title', 'prompt', 'fileName', 'latex']

describe('analytics PII guard', () => {
    beforeEach(() => trackAnalyticsEvent.mockClear())

    it('every string param value is whitelisted', () => {
        for (const event of Object.values(SAMPLES) as AnalyticsEvent[]) {
            for (const [key, value] of params(event)) {
                if (typeof value !== 'string') continue
                expect(EVENT_PROP_VALUES[key], `${event.name}.${key}`).toBeDefined()
                expect(EVENT_PROP_VALUES[key]).toContain(value)
            }
        }
    })

    it('no reserved GA4 attribution params', () => {
        for (const event of SAMPLE_EVENTS) {
            for (const [key] of params(event)) {
                expect(RESERVED, `${event.name} uses reserved param "${key}"`).not.toContain(key)
                expect(key.startsWith('campaign_')).toBe(false)
            }
        }
        // Also the whitelist itself: an optional param missing from SAMPLES is still checked here.
        for (const key of Object.keys(EVENT_PROP_VALUES)) {
            expect(RESERVED, `EVENT_PROP_VALUES uses reserved key "${key}"`).not.toContain(key)
            expect(key.startsWith('campaign_')).toBe(false)
        }
    })

    it('no identifier-shaped param names', () => {
        for (const event of SAMPLE_EVENTS) {
            for (const [key] of params(event)) {
                expect(BANNED, `${event.name} carries forbidden param "${key}"`).not.toContain(key)
            }
        }
        for (const key of Object.keys(EVENT_PROP_VALUES)) {
            expect(BANNED, `EVENT_PROP_VALUES has forbidden key "${key}"`).not.toContain(key)
        }
    })

    it('respects GA4 name and value limits', () => {
        for (const event of SAMPLE_EVENTS) {
            expect(event.name.length).toBeLessThanOrEqual(40)
            expect(params(event).length).toBeLessThanOrEqual(25)
            for (const [key, value] of params(event)) {
                expect(key.length).toBeLessThanOrEqual(40)
                if (typeof value === 'string') expect(value.length).toBeLessThanOrEqual(100)
            }
        }
        for (const [key, values] of Object.entries(EVENT_PROP_VALUES)) {
            expect(key.length).toBeLessThanOrEqual(40)
            for (const value of values) expect(value.length).toBeLessThanOrEqual(100)
        }
    })

    it('no PII-shaped values', () => {
        for (const event of Object.values(SAMPLES) as AnalyticsEvent[]) {
            for (const [, value] of params(event)) {
                expect(String(value)).not.toMatch(/@/)
                expect(String(value)).not.toMatch(/^usr_/)
            }
        }
    })

    it('track drops undefined params', () => {
        track({ name: 'login', method: 'email', trigger: undefined })
        expect(trackAnalyticsEvent).toHaveBeenCalledWith('login', { method: 'email' })
    })

    it('track sends events without params with no params object', () => {
        track({ name: 'sign_out' })
        expect(trackAnalyticsEvent).toHaveBeenCalledWith('sign_out', undefined)
    })
})
