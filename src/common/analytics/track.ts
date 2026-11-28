import { trackAnalyticsEvent } from '@/common/utils/analytics'
import type { AnalyticsEvent } from './events'

/** The only way to send an event: typed, with `undefined` params dropped (as `toParams` in the editor). */
export function track(event: AnalyticsEvent): void {
    const { name, ...rest } = event
    const params = Object.fromEntries(Object.entries(rest).filter(([, value]) => value !== undefined))
    trackAnalyticsEvent(name, Object.keys(params).length ? params : undefined)
}
