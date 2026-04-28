import Image from 'next/image'
import Link from 'next/link'
import { headers } from 'next/headers'
import type { Metadata } from 'next'
import { LANGUAGES, normalizeLanguage, type LanguageCode } from '@/lib/i18n/constants'
import notFoundEN from '@/lib/i18n/locales/en/not-found.json'
import notFoundRU from '@/lib/i18n/locales/ru/not-found.json'
import notFoundES from '@/lib/i18n/locales/es/not-found.json'
import notFoundDE from '@/lib/i18n/locales/de/not-found.json'
import './NotFoundPage.css'

export const metadata: Metadata = {
    title: '404 — Math on Canvas',
    robots: { index: false, follow: false },
}

const translations = {
    en: notFoundEN,
    ru: notFoundRU,
    es: notFoundES,
    de: notFoundDE,
} as const

async function detectLang(): Promise<LanguageCode> {
    const headersList = await headers()

    const nextUrl = headersList.get('next-url') ?? ''
    const firstSegment = nextUrl.split('/').filter(Boolean)[0] ?? ''
    const langFromUrl = LANGUAGES.find(l => l.code === firstSegment)?.code
    if (langFromUrl) return langFromUrl

    const acceptLang = headersList.get('accept-language') ?? ''
    if (acceptLang) {
        const primary = acceptLang.split(',')[0]?.split(';')[0]?.trim() ?? ''
        return normalizeLanguage(primary)
    }

    return 'en'
}

export default async function NotFound() {
    const lang = await detectLang()
    const t = translations[lang]

    return (
        <div className="notfound">
            <div className="notfound__texture" aria-hidden="true">
                <span className="notfound__grid" />
            </div>

            <header className="notfound__header">
                <div className="notfound__brand">
                    <Image
                        className="notfound__brand-logo"
                        src="/images/logo.svg"
                        alt="Math on Canvas"
                        width={36}
                        height={36}
                        unoptimized
                    />
                    <div>
                        <div className="notfound__brand-title">
                            Math on Canvas
                            <span className="notfound__beta-badge">BETA</span>
                        </div>
                        <div className="notfound__brand-subtitle">mathoncanvas.com</div>
                    </div>
                </div>
                <Link href={`/${lang}`} className="notfound__nav-link">
                    ← {t.goHome}
                </Link>
            </header>

            <main className="notfound__main">
                <div className="notfound__code" aria-hidden="true">404</div>
                <h1 className="notfound__title">{t.heading}</h1>
                <p className="notfound__description">{t.description}</p>
                <div className="notfound__actions">
                    <Link href={`/${lang}`} className="notfound__ghost">
                        ← {t.goHome}
                    </Link>
                    <Link href="/editor" className="notfound__cta">
                        {t.openEditor} →
                    </Link>
                </div>
            </main>

            <footer className="notfound__footer">
                {t.footer}
                <span className="notfound__version">
                    v{process.env.NEXT_PUBLIC_APP_VERSION}
                </span>
            </footer>
        </div>
    )
}