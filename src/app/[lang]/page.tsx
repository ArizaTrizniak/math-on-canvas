import { notFound } from 'next/navigation'
import { BASE_URL } from '@/lib/site'
import { LANGUAGES, type LanguageCode } from '@/lib/i18n/constants'
import LandingPage from '@/app/(marketing)/landing/LandingPage'
import { buildLandingJsonLd } from '@/features/landing/jsonld'

// Metadata (title, description, canonical, hreflang, OG, Twitter) is owned by
// the [lang] layout — defining it here too would override the layout's
// alternates and silently drop the x-default hreflang.

// Only 4 locales exist — return all of them so every one prerenders at build
// time instead of on first visit.
export function generateStaticParams() {
    return LANGUAGES.map(({ code }) => ({ lang: code }))
}

export default async function LangPage({
    params,
}: {
    params: Promise<{ lang: string }>
}) {
    const { lang } = await params

    const isValid = LANGUAGES.some(l => l.code === lang)
    if (!isValid) notFound()

    const langCode = lang as LanguageCode

    const jsonLd = buildLandingJsonLd(langCode, BASE_URL)

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <LandingPage lang={langCode} />
        </>
    )
}
