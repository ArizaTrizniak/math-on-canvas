import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { normalizeLanguage } from '@/lib/i18n/constants'

const LOGIN_URL = process.env.AUTH_LOGIN_URL!
const LANG_CODES = ['en', 'ru', 'es', 'de'] as const

function clearAccessTokenCookie(response: NextResponse): void {
    response.cookies.set('access_token', '', { maxAge: 0, path: '/' })
}

const PROTECTED_PATHS = ['/editor']

function isProtected(pathname: string): boolean {
    return PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

function getLangFromRequest(request: NextRequest): string {
    const langCookie = request.cookies.get('lang')?.value
    if (langCookie) return normalizeLanguage(langCookie)
    const acceptLanguage = request.headers.get('accept-language') ?? 'en'
    const primary = acceptLanguage.split(',')[0]?.split(';')[0] ?? 'en'
    return normalizeLanguage(primary)
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
    const { pathname, href } = request.nextUrl

    // Root path — redirect based on lang cookie or Accept-Language
    if (pathname === '/') {
        const lang = getLangFromRequest(request)
        const url = request.nextUrl.clone()
        url.pathname = `/${lang}`
        return NextResponse.redirect(url)
    }

    // Determine x-lang for lang-prefixed paths
    const langMatch = pathname.match(/^\/([a-z]{2})(\/|$)/)
    const langCode = langMatch && (LANG_CODES as readonly string[]).includes(langMatch[1])
        ? langMatch[1]
        : null

    const token = request.cookies.get('access_token')?.value
    const protected_ = isProtected(pathname)

    if (!token) {
        if (protected_) {
            const loginUrl = new URL(LOGIN_URL)
            loginUrl.searchParams.set('redirect_uri', href)
            return NextResponse.redirect(loginUrl)
        }
        const response = NextResponse.next()
        if (langCode) response.headers.set('x-lang', langCode)
        return response
    }

    try {
        const user = await verifyAccessToken(token)
        const response = NextResponse.next()
        if (langCode) response.headers.set('x-lang', langCode)
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
        if (langCode) response.headers.set('x-lang', langCode)
        clearAccessTokenCookie(response)
        return response
    }
}

export const config = {
    matcher: [
        '/((?!api|_next|images|assets|favicon\\.ico).*)',
    ],
}