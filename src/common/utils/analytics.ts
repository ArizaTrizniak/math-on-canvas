import ReactGA from 'react-ga4'

const STORAGE_KEY = 'moc_internal'

export const ALLOWED_ANALYTICS_HOSTNAMES = new Set([
    'www.math-on-canvas.com',
    'math-on-canvas.com'
])

export const isAllowedAnalyticsHostname = (hostname: string): boolean =>
    ALLOWED_ANALYTICS_HOSTNAMES.has(hostname.toLowerCase())

const getMeasurementId = () => process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const isProduction = () => process.env.NODE_ENV === 'production'

let initialized = false

/**
 * `localStorage` is a getter on the global object that can throw `SecurityError`
 * in hardened privacy modes (e.g. Safari "Block All Cookies"), so every access
 * is wrapped in its own try/catch and fails closed.
 */
export const isInternal = (): boolean => {
    try {
        if (typeof localStorage === 'undefined') return false
        return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
        return false
    }
}

export const markInternal = (): void => {
    try {
        if (typeof localStorage === 'undefined') return
        localStorage.setItem(STORAGE_KEY, '1')
    } catch {
        // storage blocked — fail closed, no-op
    }
}

/** `?internal=1` marks this browser permanently across landing and editor on the same origin. */
export const readInternalFromQuery = (): void => {
    try {
        if (typeof window === 'undefined') return
        const params = new URLSearchParams(window.location.search)
        if (params.get('internal') === '1') markInternal()
    } catch {
        // fail closed, no-op
    }
}

const canTrack = () => initialized && isProduction()

const pageLocation = (pathname: string) => window.location.origin + pathname

export const syncInternalFromRole = (role: string | undefined): void => {
    if (role !== 'admin') return
    markInternal()
    if (canTrack()) {
        ReactGA.gtag('set', { traffic_type: 'internal' })
        ReactGA.gtag('set', 'user_properties', { internal: true })
    }
}

export const initAnalytics = () => {
    if (typeof window === 'undefined') return
    readInternalFromQuery()

    const measurementId = getMeasurementId()
    if (
        initialized ||
        !isProduction() ||
        !measurementId ||
        !isAllowedAnalyticsHostname(window.location.hostname)
    ) {
        return
    }

    const internal = isInternal()
    // gtag `config` sends its own page_view unless told not to; the first page_view comes from
    // AnalyticsInit instead. page_location never carries the query, so one-shot markers like
    // ?auth_result / ?auth_error never reach GA4 (BL-0009).
    ReactGA.initialize(measurementId, {
        gtagOptions: {
            ...(internal ? { traffic_type: 'internal' } : {}),
            send_page_view: false,
            page_location: pageLocation(window.location.pathname)
        }
    })
    ReactGA.gtag('set', 'user_properties', { internal })

    initialized = true
}

export const trackAnalyticsEvent = (
    eventName: string,
    params?: Record<string, unknown>
) => {
    if (!canTrack()) return
    ReactGA.event(eventName, params)
}

/** Sends page_view for a pathname. The query is never sent (see initAnalytics). */
export const trackPageView = (pathname: string) => {
    if (!canTrack() || typeof window === 'undefined') return
    const location = pageLocation(pathname)
    // Later events in this page inherit page_location from `set`, not from the URL bar.
    ReactGA.gtag('set', { page_location: location })
    ReactGA.gtag('event', 'page_view', { page_path: pathname, page_location: location })
}

/**
 * Resolves once gtag has processed everything queued before the call (or after `timeoutMs`).
 * Uses a `get` command, which creates no hit: call it before a full-page navigation so the
 * events sent just before it are not lost.
 */
export const flushAnalytics = (timeoutMs = 1000): Promise<void> => {
    const measurementId = getMeasurementId()
    if (!canTrack() || !measurementId) return Promise.resolve()
    return new Promise((resolve) => {
        const timer = setTimeout(resolve, timeoutMs)
        ReactGA.gtag('get', measurementId, 'client_id', () => {
            clearTimeout(timer)
            resolve()
        })
    })
}
