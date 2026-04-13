import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { BASE_URL } from '@/lib/site'
import { LANGUAGES, type LanguageCode } from '@/lib/i18n/constants'
import { PricingPage } from '@/app/(marketing)/pricing/PricingPage'
import pricingEN from '@/lib/i18n/locales/en/pricing.json'
import pricingRU from '@/lib/i18n/locales/ru/pricing.json'
import pricingES from '@/lib/i18n/locales/es/pricing.json'
import pricingDE from '@/lib/i18n/locales/de/pricing.json'

const metaTranslations: Record<string, { title: string; description: string }> = {
    en: pricingEN.meta,
    ru: pricingRU.meta,
    es: pricingES.meta,
    de: pricingDE.meta,
}

const schemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Math on Canvas — Pricing',
    url: `${BASE_URL}/en/pricing`,
    mainEntity: {
        '@type': 'SoftwareApplication',
        name: 'Math on Canvas',
        offers: [
            {
                '@type': 'Offer',
                name: 'Guest',
                price: '0',
                priceCurrency: 'USD',
                description: 'Full editor access, LaTeX formulas, 3D/2D shapes, export to PDF/PNG/SVG. No account required.',
            },
            {
                '@type': 'Offer',
                name: 'Free',
                price: '0',
                priceCurrency: 'USD',
                description: 'Everything in Guest, plus save source files locally for re-editing.',
            },
        ],
    },
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ lang: string }>
}): Promise<Metadata> {
    const { lang } = await params
    const meta = metaTranslations[lang] ?? metaTranslations['en']
    const canonical = `${BASE_URL}/${lang}/pricing`

    return {
        title: meta.title,
        description: meta.description,
        alternates: {
            canonical,
            languages: {
                'en': `${BASE_URL}/en/pricing`,
                'ru': `${BASE_URL}/ru/pricing`,
                'es': `${BASE_URL}/es/pricing`,
                'de': `${BASE_URL}/de/pricing`,
                'x-default': `${BASE_URL}/en/pricing`,
            },
        },
        openGraph: {
            title: meta.title,
            description: meta.description,
            url: canonical,
            siteName: 'Math on Canvas',
            type: 'website',
            images: [{
                url: `${BASE_URL}/images/screen1.webp`,
                width: 1600,
                height: 900,
                alt: 'Math on Canvas — math diagram editor',
            }],
        },
    }
}

export default async function PricingRoutePage({
    params,
}: {
    params: Promise<{ lang: string }>
}) {
    const { lang } = await params
    const isValid = LANGUAGES.some(l => l.code === lang)
    if (!isValid) notFound()

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
            />
            <PricingPage lang={lang as LanguageCode} />
        </>
    )
}