import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const initialize = vi.fn()
const event = vi.fn()
const send = vi.fn()
const gtag = vi.fn()

vi.mock('react-ga4', () => ({
    default: {
        initialize: (...args: unknown[]) => initialize(...args),
        event: (...args: unknown[]) => event(...args),
        send: (...args: unknown[]) => send(...args),
        gtag: (...args: unknown[]) => gtag(...args)
    }
}))

const createMemoryStorage = () => {
    const store = new Map<string, string>()
    return {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => { store.set(key, value) },
        removeItem: (key: string) => { store.delete(key) },
        clear: () => { store.clear() }
    }
}

const stubBrowser = (locationOverrides: Partial<Location> = {}) => {
    const location = {
        hostname: 'www.math-on-canvas.com',
        origin: 'https://www.math-on-canvas.com',
        pathname: '/en',
        search: '',
        ...locationOverrides
    }
    vi.stubGlobal('window', { location })
    vi.stubGlobal('location', location)
}

describe('analytics', () => {
    const originalEnv = { ...process.env }

    beforeEach(() => {
        vi.resetModules()
        vi.clearAllMocks()
        process.env = {
            ...originalEnv,
            NODE_ENV: 'production',
            NEXT_PUBLIC_GA_MEASUREMENT_ID: 'G-TEST123'
        }
        vi.stubGlobal('localStorage', createMemoryStorage())
        stubBrowser()
    })

    afterEach(() => {
        process.env = originalEnv
        vi.unstubAllGlobals()
    })

    describe('isAllowedAnalyticsHostname', () => {
        it.each([
            'www.math-on-canvas.com',
            'math-on-canvas.com',
            'WWW.MATH-ON-CANVAS.COM'
        ])('allows canonical production hostname %s', async (hostname) => {
            const { isAllowedAnalyticsHostname } = await import('./analytics')
            expect(isAllowedAnalyticsHostname(hostname)).toBe(true)
        })

        it.each([
            'localhost',
            '127.0.0.1',
            'math-on-canvas.vercel.app',
            'staging.math-on-canvas.com',
            'evil-math-on-canvas.com',
            ''
        ])('blocks non-production hostname %s', async (hostname) => {
            const { isAllowedAnalyticsHostname } = await import('./analytics')
            expect(isAllowedAnalyticsHostname(hostname)).toBe(false)
        })
    })

    describe('initAnalytics hostname and environment guards', () => {
        it.each([
            'localhost',
            '127.0.0.1',
            'math-on-canvas.vercel.app',
            'staging.math-on-canvas.com'
        ])('does not initialize or send hits on %s', async (hostname) => {
            stubBrowser({ hostname, origin: `https://${hostname}` })
            const { initAnalytics, trackAnalyticsEvent, trackPageView } = await import('./analytics')

            initAnalytics()
            trackAnalyticsEvent('cta_click', { location: 'hero' })
            trackPageView('/en')

            expect(initialize).not.toHaveBeenCalled()
            expect(gtag).not.toHaveBeenCalled()
            expect(event).not.toHaveBeenCalled()
            expect(send).not.toHaveBeenCalled()
        })

        it('does not initialize outside production NODE_ENV', async () => {
            process.env = { ...process.env, NODE_ENV: 'development' }
            const { initAnalytics } = await import('./analytics')

            initAnalytics()

            expect(initialize).not.toHaveBeenCalled()
        })

        it('does not initialize without NEXT_PUBLIC_GA_MEASUREMENT_ID', async () => {
            delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
            const { initAnalytics } = await import('./analytics')

            initAnalytics()

            expect(initialize).not.toHaveBeenCalled()
        })

        it('initializes on www.math-on-canvas.com and forwards events and pageviews', async () => {
            const { initAnalytics, trackAnalyticsEvent, trackPageView } = await import('./analytics')

            initAnalytics()

            expect(initialize).toHaveBeenCalledWith('G-TEST123', {
                gtagOptions: { send_page_view: false, page_location: 'https://www.math-on-canvas.com/en' }
            })
            expect(gtag).toHaveBeenCalledWith('set', 'user_properties', { internal: false })
            expect(send).not.toHaveBeenCalled()

            trackAnalyticsEvent('cta_click', { location: 'hero' })
            trackPageView('/en/pricing')

            expect(event).toHaveBeenCalledWith('cta_click', { location: 'hero' })
            expect(gtag).toHaveBeenCalledWith('event', 'page_view', {
                page_path: '/en/pricing',
                page_location: 'https://www.math-on-canvas.com/en/pricing'
            })
        })

        it('initializes on apex domain math-on-canvas.com', async () => {
            stubBrowser({ hostname: 'math-on-canvas.com', origin: 'https://math-on-canvas.com' })
            const { initAnalytics } = await import('./analytics')

            initAnalytics()

            expect(initialize).toHaveBeenCalledWith('G-TEST123', {
                gtagOptions: { send_page_view: false, page_location: 'https://math-on-canvas.com/en' }
            })
            expect(gtag).toHaveBeenCalledWith('set', 'user_properties', { internal: false })
        })
    })

    describe('page_view', () => {
        it('initAnalytics keeps auth markers and other query out of the config page_location and sends no page_view', async () => {
            stubBrowser({ search: '?auth_result=signup', href: 'https://www.math-on-canvas.com/en?auth_result=signup' })
            const { initAnalytics } = await import('./analytics')

            initAnalytics()

            expect(initialize).toHaveBeenCalledWith('G-TEST123', {
                gtagOptions: { send_page_view: false, page_location: 'https://www.math-on-canvas.com/en' }
            })
            expect(send).not.toHaveBeenCalled()
            expect(gtag).not.toHaveBeenCalledWith('event', 'page_view', expect.anything())
        })

        it('trackPageView sets page_location before sending page_view with the pathname only', async () => {
            const { initAnalytics, trackPageView } = await import('./analytics')
            initAnalytics()
            gtag.mockClear()

            trackPageView('/en/catalog')

            expect(gtag.mock.calls).toEqual([
                ['set', { page_location: 'https://www.math-on-canvas.com/en/catalog' }],
                ['event', 'page_view', {
                    page_path: '/en/catalog',
                    page_location: 'https://www.math-on-canvas.com/en/catalog'
                }]
            ])
        })
    })

    describe('flushAnalytics', () => {
        it('resolves immediately without calling gtag when tracking is off', async () => {
            process.env = { ...process.env, NODE_ENV: 'development' }
            const { initAnalytics, flushAnalytics } = await import('./analytics')
            initAnalytics()

            await expect(flushAnalytics()).resolves.toBeUndefined()
            expect(gtag).not.toHaveBeenCalled()
        })

        it('waits for gtag to answer a get command, which creates no hit', async () => {
            const { initAnalytics, flushAnalytics } = await import('./analytics')
            initAnalytics()
            gtag.mockClear()

            let settled = false
            const done = flushAnalytics().then(() => { settled = true })
            await Promise.resolve()

            expect(gtag).toHaveBeenCalledTimes(1)
            expect(gtag).toHaveBeenCalledWith('get', 'G-TEST123', 'client_id', expect.any(Function))
            expect(settled).toBe(false)

            const callback = gtag.mock.calls[0][3] as (value: string) => void
            callback('123.456')
            await done
            expect(settled).toBe(true)
            expect(gtag).not.toHaveBeenCalledWith('event', expect.anything(), expect.anything())
        })

        it('resolves after the timeout when gtag never answers', async () => {
            vi.useFakeTimers()
            try {
                const { initAnalytics, flushAnalytics } = await import('./analytics')
                initAnalytics()

                let settled = false
                const done = flushAnalytics().then(() => { settled = true })
                await vi.advanceTimersByTimeAsync(999)
                expect(settled).toBe(false)
                await vi.advanceTimersByTimeAsync(1)
                await done
                expect(settled).toBe(true)
            } finally {
                vi.useRealTimers()
            }
        })
    })

    describe('internal traffic marking', () => {
        it('persists moc_internal and passes traffic_type: internal when ?internal=1 is present', async () => {
            stubBrowser({ search: '?internal=1' })
            const { initAnalytics, isInternal } = await import('./analytics')

            initAnalytics()

            expect(isInternal()).toBe(true)
            expect(localStorage.getItem('moc_internal')).toBe('1')
            expect(initialize).toHaveBeenCalledWith('G-TEST123', {
                gtagOptions: { traffic_type: 'internal', send_page_view: false, page_location: 'https://www.math-on-canvas.com/en' }
            })
            expect(gtag).toHaveBeenCalledWith('set', 'user_properties', { internal: true })
        })

        it('reads pre-existing moc_internal flag set by the editor on the same origin', async () => {
            localStorage.setItem('moc_internal', '1')
            const { initAnalytics } = await import('./analytics')

            initAnalytics()

            expect(initialize).toHaveBeenCalledWith('G-TEST123', {
                gtagOptions: { traffic_type: 'internal', send_page_view: false, page_location: 'https://www.math-on-canvas.com/en' }
            })
            expect(gtag).toHaveBeenCalledWith('set', 'user_properties', { internal: true })
        })

        it('syncInternalFromRole("admin") persists flag and marks active session internal', async () => {
            const { initAnalytics, syncInternalFromRole, isInternal } = await import('./analytics')

            initAnalytics()
            gtag.mockClear()

            syncInternalFromRole('admin')

            expect(isInternal()).toBe(true)
            expect(localStorage.getItem('moc_internal')).toBe('1')
            expect(gtag).toHaveBeenCalledWith('set', { traffic_type: 'internal' })
            expect(gtag).toHaveBeenCalledWith('set', 'user_properties', { internal: true })
        })

        it('syncInternalFromRole ignores non-admin roles', async () => {
            const { initAnalytics, syncInternalFromRole, isInternal } = await import('./analytics')

            initAnalytics()
            gtag.mockClear()

            syncInternalFromRole('free_user')

            expect(isInternal()).toBe(false)
            expect(gtag).not.toHaveBeenCalled()
        })

        it('fails closed without throwing when localStorage throws SecurityError', async () => {
            vi.stubGlobal('localStorage', {
                getItem: () => { throw new Error('SecurityError') },
                setItem: () => { throw new Error('SecurityError') }
            })
            stubBrowser({ search: '?internal=1' })
            const { initAnalytics, isInternal, markInternal } = await import('./analytics')

            expect(() => initAnalytics()).not.toThrow()
            expect(() => markInternal()).not.toThrow()
            expect(isInternal()).toBe(false)
        })
    })
})
