import { describe, it, expect } from 'vitest'
import { evaluatePassword, passwordScore, isPasswordValid } from './passwordRules'

describe('evaluatePassword', () => {
    it('returns the five rules in display order, all unmet for empty input', () => {
        const rules = evaluatePassword('')
        expect(rules.map((r) => r.key)).toEqual(['minLength', 'uppercase', 'lowercase', 'number', 'special'])
        expect(rules.every((r) => !r.met)).toBe(true)
    })

    it('marks each rule independently', () => {
        const met = Object.fromEntries(evaluatePassword('Treug2026').map((r) => [r.key, r.met]))
        expect(met).toEqual({ minLength: true, uppercase: true, lowercase: true, number: true, special: false })
    })

    it('treats a space as a special character, like Cognito', () => {
        expect(evaluatePassword('a b').find((r) => r.key === 'special')?.met).toBe(true)
    })
})

describe('passwordScore / isPasswordValid', () => {
    it('counts met rules', () => {
        expect(passwordScore('')).toBe(0)
        expect(passwordScore('Treug2026')).toBe(4)
        expect(passwordScore('Kvadrat-2026')).toBe(5)
    })

    it('is valid only when every rule is met', () => {
        expect(isPasswordValid('Treug2026')).toBe(false)
        expect(isPasswordValid('Kvadrat-2026')).toBe(true)
    })
})
