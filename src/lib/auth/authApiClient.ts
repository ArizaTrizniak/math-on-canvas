import {
    AuthNativeError,
    AuthNetworkError,
    AuthUnauthenticatedError,
    type NativeAuthApiError,
    type UserProfile,
} from './authTypes'

const baseUrl = () => process.env.NEXT_PUBLIC_AUTH_API_URL ?? ''

async function parseError(res: Response): Promise<never> {
    let body: NativeAuthApiError | undefined
    try {
        body = (await res.json()) as NativeAuthApiError
    } catch {
        // not JSON
    }
    if (body?.error) {
        throw new AuthNativeError(body.message, body.error)
    }
    if (res.status === 401 || res.status === 403) {
        throw new AuthUnauthenticatedError()
    }
    throw new AuthNetworkError(`HTTP ${res.status}`)
}

async function post<T>(path: string, body?: unknown): Promise<T> {
    let res: Response
    try {
        res = await fetch(`${baseUrl()}${path}`, {
            method: 'POST',
            credentials: 'include',
            headers: body ? { 'Content-Type': 'application/json' } : undefined,
            body: body ? JSON.stringify(body) : undefined,
        })
    } catch (err) {
        throw new AuthNetworkError(err instanceof Error ? err.message : 'Network error')
    }
    if (!res.ok) return parseError(res)
    return res.json() as Promise<T>
}

async function get<T>(path: string): Promise<T> {
    let res: Response
    try {
        res = await fetch(`${baseUrl()}${path}`, {
            method: 'GET',
            credentials: 'include',
        })
    } catch (err) {
        throw new AuthNetworkError(err instanceof Error ? err.message : 'Network error')
    }
    if (!res.ok) return parseError(res)
    return res.json() as Promise<T>
}

export const authApiClient = {
    signUp(email: string, password: string, displayName: string) {
        return post<{ confirmationRequired: boolean; email: string }>('/auth/signup', {
            email,
            password,
            displayName,
        })
    },

    confirmSignUp(email: string, code: string) {
        return post<{ confirmed: boolean }>('/auth/confirm-signup', { email, code })
    },

    signIn(email: string, password: string) {
        return post<{ success: boolean }>('/auth/signin', { email, password })
    },

    resendCode(email: string) {
        return post<{ sent: boolean }>('/auth/resend-code', { email })
    },

    getMe() {
        return get<UserProfile>('/auth/me')
    },

    async refresh() {
        return post<{ expiresIn: number }>('/auth/refresh')
    },

    async signOut() {
        try {
            await fetch(`${baseUrl()}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            })
        } catch {
            // best effort
        }
    },
}
