import type { Metadata } from 'next'
import { BASE_URL, OG_IMAGE } from '@/lib/site'
import landingEN from '@/lib/i18n/locales/en/landing.json'
import landingRU from '@/lib/i18n/locales/ru/landing.json'
import landingES from '@/lib/i18n/locales/es/landing.json'
import landingDE from '@/lib/i18n/locales/de/landing.json'

const metaTranslations: Record<string, { title: string; description: string }> = {
    en: landingEN.meta,
    ru: landingRU.meta,
    es: landingES.meta,
    de: landingDE.meta,
}

const OG_LOCALES: Record<string, string> = {
    en: 'en_US',
    ru: 'ru_RU',
    es: 'es_ES',
    de: 'de_DE',
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ lang: string }>
}): Promise<Metadata> {
    const { lang } = await params
    const canonical = `${BASE_URL}/${lang}`
    const meta = metaTranslations[lang] ?? metaTranslations['en']
    const ogLocale = OG_LOCALES[lang] ?? OG_LOCALES['en']

    return {
        title: meta.title,
        description: meta.description,
        alternates: {
            canonical,
            languages: {
                'en': `${BASE_URL}/en`,
                'ru': `${BASE_URL}/ru`,
                'es': `${BASE_URL}/es`,
                'de': `${BASE_URL}/de`,
                'x-default': `${BASE_URL}/en`,
            },
        },
        openGraph: {
            title: meta.title,
            description: meta.description,
            url: canonical,
            siteName: 'Math on Canvas',
            type: 'website',
            locale: ogLocale,
            alternateLocale: Object.values(OG_LOCALES).filter((l) => l !== ogLocale),
            images: [OG_IMAGE],
        },
        twitter: {
            card: 'summary_large_image',
            title: meta.title,
            description: meta.description,
            images: [OG_IMAGE.url],
        },
    }
}

export default function LangLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}