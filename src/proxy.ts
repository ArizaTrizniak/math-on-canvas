import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'

function clearAccessTokenCookie(response: NextResponse): void {
    response.cookies.set('access_token', '', { maxAge: 0, path: '/' })
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
    const token = request.cookies.get('access_token')?.value

    if (!token) {
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
        const response = NextResponse.next()
        clearAccessTokenCookie(response)
        return response
    }
}

export const config = {
    matcher: ['/', '/editor', '/editor/:path*'],
}
