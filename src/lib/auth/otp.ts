export const OTP_LENGTH = 6

export interface OtpUpdate {
    cells: string[]
    focusIndex: number
}

export function emptyOtp(): string[] {
    return Array.from({ length: OTP_LENGTH }, () => '')
}

export function otpValue(cells: string[]): string {
    return cells.join('')
}

/**
 * Applies whatever landed in cell `index` — one typed key, a replacement typed
 * over an existing digit, or a whole pasted code — and says where focus goes next.
 */
export function applyOtpInput(cells: string[], index: number, raw: string): OtpUpdate {
    const digits = raw.replace(/\D/g, '')
    if (!digits) return { cells, focusIndex: index }

    const next = [...cells]
    // Typing over a filled cell yields "old+new": keep only the new digit.
    const incoming = digits.length === 2 && cells[index] && digits.startsWith(cells[index])
        ? digits.slice(1)
        : digits

    let last = index
    for (let i = 0; i < incoming.length && index + i < OTP_LENGTH; i++) {
        next[index + i] = incoming[i]
        last = index + i
    }
    return { cells: next, focusIndex: Math.min(last + 1, OTP_LENGTH - 1) }
}

export function applyOtpBackspace(cells: string[], index: number): OtpUpdate {
    const next = [...cells]
    if (next[index]) {
        next[index] = ''
        return { cells: next, focusIndex: index }
    }
    const prev = Math.max(index - 1, 0)
    next[prev] = ''
    return { cells: next, focusIndex: prev }
}

export function formatCountdown(seconds: number): string {
    const s = Math.max(0, Math.floor(seconds))
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** True when the cells just became a complete code that differs from what was there before. */
export function shouldAutoSubmit(prev: string[], next: string[]): boolean {
    const value = otpValue(next)
    return value.length === OTP_LENGTH && value !== otpValue(prev)
}
