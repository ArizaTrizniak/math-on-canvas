import type { LanguageCode } from '@/lib/i18n/constants'
import landingEN from '@/lib/i18n/locales/en/landing.json'
import landingRU from '@/lib/i18n/locales/ru/landing.json'
import landingES from '@/lib/i18n/locales/es/landing.json'
import landingDE from '@/lib/i18n/locales/de/landing.json'
import { featureKeys, faqKeys, screenshotKeys } from './keys'

const translations = {
    en: landingEN,
    ru: landingRU,
    es: landingES,
    de: landingDE,
} as const

/**
 * Structured data for the landing page: the app itself plus the FAQ block.
 * Emitted per locale so each language variant describes itself in its own words.
 */
export function buildLandingJsonLd(lang: LanguageCode, baseUrl: string) {
    const t = translations[lang]
    const pageUrl = `${baseUrl}/${lang}`

    return {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'WebApplication',
                '@id': `${baseUrl}/#app`,
                name: 'Math on Canvas',
                url: pageUrl,
                description: t.meta.description,
                inLanguage: lang,
                applicationCategory: 'EducationalApplication',
                applicationSubCategory: 'Math diagram and formula editor',
                operatingSystem: 'Web browser',
                browserRequirements: 'Requires JavaScript',
                featureList: featureKeys.map((key) => t.features[key]),
                screenshot: screenshotKeys.map((_, index) => `${baseUrl}/images/screen${index + 1}.webp`),
                offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'USD',
                },
            },
            {
                '@type': 'FAQPage',
                '@id': `${pageUrl}#faq`,
                inLanguage: lang,
                mainEntity: faqKeys.map((key) => ({
                    '@type': 'Question',
                    name: t.faq.items[key].q,
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: t.faq.items[key].a,
                    },
                })),
            },
        ],
    }
}