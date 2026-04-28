import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { LANGUAGES, normalizeLanguage } from '@/lib/i18n/constants'

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const firstSegment = pathname.split('/').filter(Boolean)[0] ?? ''
    const langFromPath = LANGUAGES.find(l => l.code === firstSegment)?.code

    const acceptLang = request.headers.get('accept-language') ?? ''
    const primaryAccept = acceptLang.split(',')[0]?.split(';')[0]?.trim() ?? ''
    const lang = langFromPath ?? (primaryAccept ? normalizeLanguage(primaryAccept) : 'en')

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-lang', lang)
    requestHeaders.set('x-pathname', pathname)

    return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon\\.ico|images/|icon\\.svg|sitemap\\.xml).*)'],
}