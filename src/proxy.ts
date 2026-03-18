import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'

const LOGIN_URL = process.env.AUTH_LOGIN_URL!

function clearAccessTokenCookie(response: NextResponse): void {
    response.cookies.set('access_token', '', { maxAge: 0, path: '/' })
}

const PROTECTED_PATHS = ['/editor']

function isProtected(pathname: string): boolean {
    return PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
    const token = request.cookies.get('access_token')?.value
    const { pathname, href } = request.nextUrl
    const protected_ = isProtected(pathname)

    if (!token) {
        if (protected_) {
            const loginUrl = new URL(LOGIN_URL)
            loginUrl.searchParams.set('redirect_uri', href)
            return NextResponse.redirect(loginUrl)
        }
        return NextResponse.next()
    }

    try {
        const user = await verifyAccessToken(token)
        const response = NextResponse.next()
        response.headers.set('x-user-id', user.userId)
        response.headers.set('x-user-role', user.role)
        response.headers.set('x-user-ent', JSON.stringify(user.entitlements))
        return response
    } catch {
        if (protected_) {
            const loginUrl = new URL(LOGIN_URL)
            loginUrl.searchParams.set('redirect_uri', href)
            const response = NextResponse.redirect(loginUrl)
            clearAccessTokenCookie(response)
            return response
        }
        const response = NextResponse.next()
        clearAccessTokenCookie(response)
        return response
    }
}

export const config = {
    matcher: ['/', '/editor', '/editor/:path*'],
}
