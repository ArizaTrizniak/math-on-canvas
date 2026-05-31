import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { BASE_URL } from '@/lib/site'
import { LANGUAGES, type LanguageCode } from '@/lib/i18n/constants'
import { getPublicDocumentMeta, listPublicDocuments } from '@/features/catalog/serverClient'
import { parseIdFromSlug } from '@/features/catalog/slug'
import { DocumentView } from '@/features/catalog/components/DocumentView'
import { documentLocalizedMeta, hreflangAlternates } from '@/features/catalog/seo/metadata'
import { creativeWork, breadcrumbList } from '@/features/catalog/seo/jsonld'
import { buildThumbnailUrl } from '@/features/catalog/thumbnail'
import catalogEN from '@/lib/i18n/locales/en/catalog.json'
import catalogRU from '@/lib/i18n/locales/ru/catalog.json'
import catalogES from '@/lib/i18n/locales/es/catalog.json'
import catalogDE from '@/lib/i18n/locales/de/catalog.json'

export const revalidate = 300

type CatalogStrings = typeof catalogEN

const catalogTranslations: Record<string, CatalogStrings> = {
    en: catalogEN,
    ru: catalogRU,
    es: catalogES,
    de: catalogDE,
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ lang: string; slug: string }>
}): Promise<Metadata> {
    const { lang, slug } = await params
    const id = parseIdFromSlug(slug)
    const doc = await getPublicDocumentMeta(id)

    if (!doc || doc.visibility !== 'public') {
        return { title: 'Not found' }
    }

    const { title, description } = documentLocalizedMeta(doc, lang)
    const canonical = `${BASE_URL}/${lang}/catalog/${slug}`
    const thumbnailUrl = buildThumbnailUrl(doc.thumbnailS3Key)

    const isThinContent = !doc.description && !doc.thumbnailS3Key

    return {
        title,
        description,
        alternates: {
            canonical,
            languages: hreflangAlternates('/catalog/' + slug),
        },
        openGraph: {
            title,
            description,
            url: canonical,
            siteName: 'Math on Canvas',
            type: 'website',
            ...(thumbnailUrl ? { images: [thumbnailUrl] } : {}),
        },
        ...(isThinContent ? { robots: { index: false } } : {}),
    }
}

export default async function CatalogDocumentPage({
    params,
}: {
    params: Promise<{ lang: string; slug: string }>
}) {
    const { lang, slug } = await params

    const isValid = LANGUAGES.some(l => l.code === lang)
    if (!isValid) notFound()

    const id = parseIdFromSlug(slug)
    const doc = await getPublicDocumentMeta(id)

    if (!doc || doc.visibility !== 'public') {
        notFound()
    }

    const relatedResult = await listPublicDocuments({
        category: doc.category ?? undefined,
        limit: 6,
    })
    const related = relatedResult.documents.filter(d => d.documentId !== doc.documentId)

    const strings = catalogTranslations[lang as LanguageCode] ?? catalogTranslations['en']
    const docStrings = {
        open: strings.open,
        share: strings.share,
        gateIntro: strings.gateIntro,
        related: strings.related,
    }

    const { title, description } = documentLocalizedMeta(doc, lang)
    const canonical = `${BASE_URL}/${lang}/catalog/${slug}`
    const thumbnailUrl = buildThumbnailUrl(doc.thumbnailS3Key)

    const creativeWorkJsonLd = creativeWork({
        name: title,
        description,
        ...(thumbnailUrl ? { image: thumbnailUrl } : {}),
        inLanguage: lang,
        url: canonical,
        dateModified: doc.updatedAt,
    })

    const breadcrumbJsonLd = breadcrumbList([
        { name: strings.breadcrumbs.home, url: `${BASE_URL}/${lang}` },
        { name: strings.breadcrumbs.catalog, url: `${BASE_URL}/${lang}/catalog` },
        { name: title, url: canonical },
    ])

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(creativeWorkJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />
            <DocumentView doc={doc} lang={lang} related={related} strings={docStrings} />
        </>
    )
}
