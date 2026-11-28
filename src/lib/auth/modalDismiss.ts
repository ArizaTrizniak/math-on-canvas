export interface ModalDismissTracker {
    set(onDismiss?: () => void): void
    dismiss(): void
    complete(): void
}

/**
 * Tracks a feature-supplied dismissal callback for the auth modal without coupling
 * `AuthProvider` to any feature module. Only explicit cancellations (`dismiss`) invoke
 * the callback; successful completions (`complete`) clear it silently.
 */
export function createModalDismissTracker(): ModalDismissTracker {
    let current: (() => void) | null = null
    return {
        set(onDismiss?: () => void) {
            current = onDismiss ?? null
        },
        dismiss() {
            const cb = current
            current = null
            cb?.()
        },
        complete() {
            current = null
        },
    }
}
