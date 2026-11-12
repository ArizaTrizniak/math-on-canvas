import { describe, it, expect } from 'vitest'
import { emailProblem } from './emailValidation'

describe('emailProblem', () => {
    it('returns null for a plausible address', () => {
        expect(emailProblem('anna@school.ru')).toBeNull()
        expect(emailProblem('  anna@school.ru ')).toBeNull()
    })

    it('does not complain about an empty field (required handles it)', () => {
        expect(emailProblem('')).toBeNull()
    })

    it('flags a missing @', () => {
        expect(emailProblem('anna.school.ru')).toBe('missingAt')
    })

    it('flags a missing domain dot', () => {
        expect(emailProblem('anna@school')).toBe('missingDomain')
        expect(emailProblem('anna@')).toBe('missingDomain')
    })
})
