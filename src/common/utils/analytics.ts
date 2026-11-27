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
    if (internal) {
        ReactGA.initialize(measurementId, {
            gtagOptions: {
                traffic_type: 'internal'
            }
        })
    } else {
        ReactGA.initialize(measurementId)
    }
    ReactGA.gtag('set', 'user_properties', { internal })
    ReactGA.send({
        hitType: 'pageview',
        page: window.location.pathname + window.location.search
    })

    initialized = true
}

export const trackAnalyticsEvent = (
    eventName: string,
    params?: Record<string, unknown>
) => {
    if (!canTrack()) return
    ReactGA.event(eventName, params)
}

export const trackPageView = (path?: string) => {
    if (!canTrack() || typeof window === 'undefined') return
    ReactGA.send({
        hitType: 'pageview',
        page: path ?? window.location.pathname + window.location.search
    })
}
