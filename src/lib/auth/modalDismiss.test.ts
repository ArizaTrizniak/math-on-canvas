import { describe, it, expect, vi } from 'vitest'
import { createModalDismissTracker } from './modalDismiss'

describe('createModalDismissTracker', () => {
    it('invokes onDismiss once when dismissed and clears it', () => {
        const tracker = createModalDismissTracker()
        const onDismiss = vi.fn()

        tracker.set(onDismiss)
        tracker.dismiss()
        tracker.dismiss()

        expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it('complete() drops onDismiss without calling it (finishSignIn / ResetDone Continue)', () => {
        const tracker = createModalDismissTracker()
        const onDismiss = vi.fn()

        tracker.set(onDismiss)
        tracker.complete()
        tracker.dismiss()

        expect(onDismiss).not.toHaveBeenCalled()
    })

    it('set() replaces a previously registered callback', () => {
        const tracker = createModalDismissTracker()
        const first = vi.fn()
        const second = vi.fn()

        tracker.set(first)
        tracker.set(second)
        tracker.dismiss()

        expect(first).not.toHaveBeenCalled()
        expect(second).toHaveBeenCalledTimes(1)
    })
})
