import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { AuthUser, Role } from './types'

const JWKS_URL = process.env.AUTH_JWKS_URL!
const ISSUER = process.env.AUTH_ISSUER!
const AUDIENCE = process.env.AUTH_AUDIENCE!

// Singleton — jose caches and re-fetches on unknown kid
const JWKS = createRemoteJWKSet(new URL(JWKS_URL))

export async function verifyAccessToken(token: string): Promise<AuthUser> {
    const { payload } = await jwtVerify(token, JWKS, {
        issuer: ISSUER,
        audience: AUDIENCE,
        algorithms: ['RS256'],
    })

    return {
        userId: payload.sub as string,
        role: payload['role'] as Role,
        entitlements: (payload['ent'] as string[]) ?? [],
    }
}
