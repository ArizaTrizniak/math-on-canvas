export type PasswordRuleKey = 'minLength' | 'uppercase' | 'lowercase' | 'number' | 'special'

export interface PasswordRuleResult {
    key: PasswordRuleKey
    met: boolean
}

const RULES: ReadonlyArray<{ key: PasswordRuleKey; test: (pw: string) => boolean }> = [
    { key: 'minLength', test: (pw) => pw.length >= 8 },
    { key: 'uppercase', test: (pw) => /[A-Z]/.test(pw) },
    { key: 'lowercase', test: (pw) => /[a-z]/.test(pw) },
    { key: 'number', test: (pw) => /[0-9]/.test(pw) },
    { key: 'special', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
]

/** Mirrors the Cognito pool policy the backend enforces. */
export function evaluatePassword(password: string): PasswordRuleResult[] {
    return RULES.map(({ key, test }) => ({ key, met: test(password) }))
}

export function passwordScore(password: string): number {
    return evaluatePassword(password).filter((r) => r.met).length
}

export function isPasswordValid(password: string): boolean {
    return passwordScore(password) === RULES.length
}
