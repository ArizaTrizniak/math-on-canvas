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
import { getCatalogStrings, getCategoryLabel } from '@/features/catalog/i18n'
import { pickRelated } from '@/features/catalog/docPage'
import { CatalogShell } from '@/features/catalog/components/CatalogShell'
import { BackToResults } from '@/features/catalog/components/BackToResults'

export const revalidate = 300

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

    // Same category first; top up by the first tag when the category is thin.
    const byCategory = doc.category
        ? (await listPublicDocuments({ category: doc.category, limit: 7 })).documents
        : []
    const firstTag = doc.tags?.[0]
    const needMore = byCategory.filter(d => d.documentId !== doc.documentId).length < 3
    const byTag = needMore && firstTag
        ? (await listPublicDocuments({ tags: [firstTag], limit: 7 })).documents
        : []
    const related = pickRelated(byCategory, byTag, doc.documentId)

    const strings = getCatalogStrings(lang)

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
            <CatalogShell lang={lang as LanguageCode} pathSuffix={`/catalog/${slug}`}>
                <div className="catalog-doc-nav">
                    <nav aria-label="Breadcrumb">
                        <ol>
                            <li><a href={`/${lang}`}>{strings.breadcrumbs.home}</a></li>
                            <li><a href={`/${lang}/catalog`}>{strings.breadcrumbs.catalog}</a></li>
                            {doc.category && (
                                <li><a href={`/${lang}/catalog/category/${doc.category}`}>{getCategoryLabel(doc.category, lang)}</a></li>
                            )}
                            <li aria-current="page">{title}</li>
                        </ol>
                    </nav>
                    <BackToResults lang={lang} label={strings.doc.backToResults} className="catalog-doc-nav__back" />
                </div>
                <DocumentView doc={doc} lang={lang} related={related} />
            </CatalogShell>
        </>
    )
}
