import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { clearPendingAuthSession, consumeLastAuthTrigger, writePendingAuthSession } from './pendingAuthAction'

const createMemoryStorage = (): Storage => {
    const data = new Map<string, string>()
    return {
        get length() { return data.size },
        clear: () => data.clear(),
        getItem: (key) => data.get(key) ?? null,
        key: (index) => [...data.keys()][index] ?? null,
        removeItem: (key) => { data.delete(key) },
        setItem: (key, value) => { data.set(key, String(value)) },
    }
}

describe('pending auth session (shared with the editor on the same origin)', () => {
    beforeEach(() => {
        vi.stubGlobal('sessionStorage', createMemoryStorage())
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('stores the trigger and consumes it once', () => {
        writePendingAuthSession('pricing')

        expect(sessionStorage.getItem('moc_last_auth_trigger')).toBe('pricing')
        expect(consumeLastAuthTrigger()).toBe('pricing')
        expect(consumeLastAuthTrigger()).toBeNull()
    })

    it('drops a pending action the editor left behind', () => {
        sessionStorage.setItem('moc_pending_auth_action', 'save_project')

        writePendingAuthSession('landing')

        expect(sessionStorage.getItem('moc_pending_auth_action')).toBeNull()
    })

    it('ignores an editor trigger the site does not know', () => {
        sessionStorage.setItem('moc_last_auth_trigger', 'save_project')

        expect(consumeLastAuthTrigger()).toBeNull()
        expect(sessionStorage.getItem('moc_last_auth_trigger')).toBeNull()
    })

    it('clearPendingAuthSession removes both keys', () => {
        sessionStorage.setItem('moc_pending_auth_action', 'save_project')
        writePendingAuthSession('catalog')

        clearPendingAuthSession()

        expect(sessionStorage.getItem('moc_last_auth_trigger')).toBeNull()
        expect(sessionStorage.getItem('moc_pending_auth_action')).toBeNull()
    })

    it('fails closed when sessionStorage throws', () => {
        const blocked = () => { throw new Error('SecurityError') }
        vi.stubGlobal('sessionStorage', { getItem: blocked, setItem: blocked, removeItem: blocked })

        expect(() => writePendingAuthSession('landing')).not.toThrow()
        expect(() => clearPendingAuthSession()).not.toThrow()
        expect(consumeLastAuthTrigger()).toBeNull()
    })
})
