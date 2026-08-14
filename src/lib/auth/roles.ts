import type { AuthUser } from './types'

/**
 * Whether the request belongs to an administrator.
 *
 * Reads the role that the proxy derived from the verified JWT, so this is only
 * as trustworthy as `getUserFromHeaders` — never call it with a user object
 * assembled from client-supplied data.
 */
export function isAdmin(user: AuthUser | null | undefined): boolean {
    return user?.role === 'admin'
}
