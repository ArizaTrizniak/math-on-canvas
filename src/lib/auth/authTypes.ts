export class AuthNativeError extends Error {
    constructor(
        message: string,
        public readonly code: string
    ) {
        super(message)
        this.name = 'AuthNativeError'
    }
}

export class AuthNetworkError extends Error {
    constructor(message = 'Network error') {
        super(message)
        this.name = 'AuthNetworkError'
    }
}

export class AuthUnauthenticatedError extends Error {
    constructor(message = 'Unauthenticated') {
        super(message)
        this.name = 'AuthUnauthenticatedError'
    }
}

export class AuthRefreshFailedError extends Error {
    constructor(message = 'Token refresh failed') {
        super(message)
        this.name = 'AuthRefreshFailedError'
    }
}

export interface UserProfile {
    userId: string
    email: string
    displayName: string
    role: 'free_user' | 'pro_user' | 'business_user' | 'admin'
    entitlements: {
        products: Array<{
            productId: string
            type: string
            grantedAt: string
            expiresAt: string | null
        }>
        aiCredits: {
            remaining: number
            monthlyQuota: number
            resetAt: string | null
        } | null
        plan: {
            type: string
            expiresAt: string | null
        } | null
    }
}

export interface NativeAuthApiError {
    error: string
    message: string
    request_id: string
}
