import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { AuthUser, Role } from './types'

// Lazy singleton — created on first request, not at module load time.
// This prevents "Invalid URL" crashes when env vars are missing at cold start.
let JWKS: ReturnType<typeof createRemoteJWKSet> | null = null

function getJWKS(): ReturnType<typeof createRemoteJWKSet> {
    if (!JWKS) {
        const url = process.env.AUTH_JWKS_URL
        if (!url) throw new Error('AUTH_JWKS_URL is not set')
        JWKS = createRemoteJWKSet(new URL(url))
    }
    return JWKS
}

export async function verifyAccessToken(token: string): Promise<AuthUser> {
    const { payload } = await jwtVerify(token, getJWKS(), {
        issuer: process.env.AUTH_ISSUER,
        audience: process.env.AUTH_AUDIENCE,
        algorithms: ['RS256'],
    })

    return {
        userId: payload.sub as string,
        role: payload['role'] as Role,
        entitlements: (payload['ent'] as string[]) ?? [],
    }
}
