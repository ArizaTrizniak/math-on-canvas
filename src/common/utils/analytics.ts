import ReactGA from 'react-ga4'

const MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const isProd = process.env.NODE_ENV === 'production'

let initialized = false

export const initAnalytics = () => {
    if (initialized || !isProd || !MEASUREMENT_ID || typeof window === 'undefined') return

    ReactGA.initialize(MEASUREMENT_ID)
    ReactGA.send({
        hitType: 'pageview',
        page: window.location.pathname + window.location.search
    })

    initialized = true
}

const canTrack = () => initialized && isProd

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
