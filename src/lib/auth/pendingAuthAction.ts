import { AUTH_MODAL_TRIGGERS, type AuthModalTrigger } from '@/common/analytics/events'

/**
 * The trigger of the last sign-in prompt survives the Google redirect in sessionStorage.
 * Same keys as the editor (same origin): the site only writes the trigger and drops a
 * pending editor action left behind, so it cannot fire after a sign-in on the site.
 */
const ACTION_KEY = 'moc_pending_auth_action'
const TRIGGER_KEY = 'moc_last_auth_trigger'

const VALID_TRIGGERS: readonly string[] = AUTH_MODAL_TRIGGERS

function readStorage(key: string): string | null {
    try {
        if (typeof sessionStorage === 'undefined') return null
        return sessionStorage.getItem(key)
    } catch {
        return null
    }
}

function writeStorage(key: string, value: string): void {
    try {
        if (typeof sessionStorage === 'undefined') return
        sessionStorage.setItem(key, value)
    } catch {
        // Storage blocked (e.g. Safari "Block All Cookies") — fail closed, no-op
    }
}

function removeStorage(key: string): void {
    try {
        if (typeof sessionStorage === 'undefined') return
        sessionStorage.removeItem(key)
    } catch {
        // fail closed, no-op
    }
}

export function writePendingAuthSession(trigger: AuthModalTrigger): void {
    writeStorage(TRIGGER_KEY, trigger)
    removeStorage(ACTION_KEY)
}

/** Returns the stored trigger if the site knows it (editor triggers give null) and removes it. */
export function consumeLastAuthTrigger(): AuthModalTrigger | null {
    const raw = readStorage(TRIGGER_KEY)
    removeStorage(TRIGGER_KEY)
    return raw && VALID_TRIGGERS.includes(raw) ? raw as AuthModalTrigger : null
}

export function clearPendingAuthSession(): void {
    removeStorage(ACTION_KEY)
    removeStorage(TRIGGER_KEY)
}
