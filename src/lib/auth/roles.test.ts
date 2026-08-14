import { describe, it, expect } from 'vitest'
import { isAdmin } from './roles'
import type { AuthUser, Role } from './types'

function user(role: Role): AuthUser {
    return { userId: 'u1', role, entitlements: [] }
}

describe('isAdmin', () => {
    it('accepts only the admin role', () => {
        expect(isAdmin(user('admin'))).toBe(true)
    })

    it('rejects every other role', () => {
        const others: Role[] = ['free_user', 'pro_user', 'business_user']
        for (const role of others) {
            expect(isAdmin(user(role)), role).toBe(false)
        }
    })

    it('rejects anonymous visitors', () => {
        expect(isAdmin(null)).toBe(false)
        expect(isAdmin(undefined)).toBe(false)
    })

    it('rejects a user whose role header was missing', () => {
        expect(isAdmin({ userId: 'u1', entitlements: [] } as unknown as AuthUser)).toBe(false)
    })
})
