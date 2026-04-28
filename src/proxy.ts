import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { normalizeLanguage } from '@/lib/i18n/constants'

const LANG_CODES = ['en', 'ru', 'es', 'de'] as const

function clearAccessTokenCookie(response: NextResponse): void {
    response.cookies.set('access_token', '', { maxAge: 0, path: '/' })
}

function getLangFromRequest(request: NextRequest): string {
    const langCookie = request.cookies.get('lang')?.value
    if (langCookie) return normalizeLanguage(langCookie)
    const acceptLanguage = request.headers.get('accept-language') ?? 'en'
    const primary = acceptLanguage.split(',')[0]?.split(';')[0] ?? 'en'
    return normalizeLanguage(primary)
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
    const { pathname } = request.nextUrl

    // Root path — redirect based on lang cookie or Accept-Language
    if (pathname === '/') {
        const lang = getLangFromRequest(request)
        const url = request.nextUrl.clone()
        url.pathname = `/${lang}`
        return NextResponse.redirect(url)
    }

    // Set x-lang header for lang-prefixed paths
    const langMatch = pathname.match(/^\/([a-z]{2})(\/|$)/)
    const langCode = langMatch && (LANG_CODES as readonly string[]).includes(langMatch[1])
        ? langMatch[1]
        : null

    // Forward x-lang and x-pathname to Server Components via request headers.
    // x-lang: from URL path (e.g. /es/...) or cookie/accept-language fallback.
    // x-pathname: needed by not-found.tsx to detect lang when notFound() is called.
    const lang = langCode ?? getLangFromRequest(request)
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-lang', lang)
    requestHeaders.set('x-pathname', pathname)

    const token = request.cookies.get('access_token')?.value

    if (!token) {
        return NextResponse.next({ request: { headers: requestHeaders } })
    }

    try {
        const user = await verifyAccessToken(token)
        const response = NextResponse.next({ request: { headers: requestHeaders } })
        response.headers.set('x-user-id', user.userId)
        response.headers.set('x-user-role', user.role)
        response.headers.set('x-user-ent', JSON.stringify(user.entitlements))
        return response
    } catch {
        const response = NextResponse.next({ request: { headers: requestHeaders } })
        clearAccessTokenCookie(response)
        return response
    }
}

export const config = {
    matcher: [
        '/((?!api|_next|images|assets|favicon\\.ico).*)',
    ],
}