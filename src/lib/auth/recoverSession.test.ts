import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

let releaseFlush: () => void = () => {}
const flushAnalytics = vi.fn(() => new Promise<void>((resolve) => { releaseFlush = resolve }))
vi.mock('@/common/utils/analytics', () => ({ flushAnalytics: () => flushAnalytics() }))

import { reloadToRecoverSession } from './recoverSession'

describe('reloadToRecoverSession', () => {
    const reload = vi.fn()

    beforeEach(() => {
        reload.mockClear()
        flushAnalytics.mockClear()
        vi.stubGlobal('window', { location: { reload } })
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('reloads the page only after the queued analytics events are flushed', async () => {
        const done = reloadToRecoverSession()
        await Promise.resolve()

        expect(flushAnalytics).toHaveBeenCalledTimes(1)
        expect(reload).not.toHaveBeenCalled()

        releaseFlush()
        await done
        expect(reload).toHaveBeenCalledTimes(1)
    })
})
