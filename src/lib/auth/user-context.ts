import { headers } from 'next/headers'
import type { AuthUser, Role } from './types'

export async function getUserFromHeaders(): Promise<AuthUser | null> {
    const headersList = await headers()
    const userId = headersList.get('x-user-id')
    if (!userId) return null
    return {
        userId,
        role: headersList.get('x-user-role') as Role,
        entitlements: JSON.parse(headersList.get('x-user-ent') ?? '[]'),
    }
}
