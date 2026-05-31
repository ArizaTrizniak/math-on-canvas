import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { BASE_URL } from '@/lib/site'
import { LANGUAGES } from '@/lib/i18n/constants'
import { listPublicDocuments } from '@/features/catalog/serverClient'
import { CatalogGrid } from '@/features/catalog/components/CatalogGrid'
import { buildSlug } from '@/features/catalog/slug'
import { hreflangAlternates } from '@/features/catalog/seo/metadata'
import { collectionPage, breadcrumbList } from '@/features/catalog/seo/jsonld'
import { getCatalogStrings } from '@/features/catalog/i18n'

export const revalidate = 300

const TAG_INDEX_MIN = 3

export async function generateMetadata({
    params,
}: {
    params: Promise<{ lang: string; tag: string }>
}): Promise<Metadata> {
    const { lang, tag } = await params
    const strings = getCatalogStrings(lang)
    const encodedTag = encodeURIComponent(tag)
    const canonical = `${BASE_URL}/${lang}/catalog/tag/${encodedTag}`

    const title = strings.tagHub.metaTitle.replaceAll('{tag}', tag)
    const description = strings.tagHub.metaDescription.replaceAll('{tag}', tag)

    // Deduped with the page's identical fetch by Next.js request memoization (same URL + options).
    const result = await listPublicDocuments({ tags: [tag], limit: 24 })
    const thinTag = result.documents.length < TAG_INDEX_MIN

    return {
        title,
        description,
        ...(thinTag ? { robots: { index: false } } : {}),
        alternates: {
            canonical,
            languages: hreflangAlternates(`/catalog/tag/${encodedTag}`),
        },
        openGraph: {
            title,
            description,
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

export default async function TagHubPage({
    params,
}: {
    params: Promise<{ lang: string; tag: string }>
}) {
    const { lang, tag } = await params

    const isValidLang = LANGUAGES.some(l => l.code === lang)
    if (!isValidLang) notFound()

    const result = await listPublicDocuments({ tags: [tag], limit: 24 })
    const documents = result.documents

    const strings = getCatalogStrings(lang)
    const encodedTag = encodeURIComponent(tag)
    const canonical = `${BASE_URL}/${lang}/catalog/tag/${encodedTag}`
    const heading = strings.tagHub.heading.replaceAll('{tag}', tag)

    const jsonLdCollection = collectionPage({
        name: heading,
        url: canonical,
        itemUrls: documents.map(doc => `${BASE_URL}/${lang}/catalog/${buildSlug(doc.title, doc.documentId)}`),
    })

    const jsonLdBreadcrumb = breadcrumbList([
        { name: strings.breadcrumbs.home, url: `${BASE_URL}/${lang}` },
        { name: strings.breadcrumbs.catalog, url: `${BASE_URL}/${lang}/catalog` },
        { name: tag, url: canonical },
    ])

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdCollection) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
            />
            <main>
                <nav aria-label="Breadcrumb">
                    <ol>
                        <li><a href={`/${lang}`}>{strings.breadcrumbs.home}</a></li>
                        <li><a href={`/${lang}/catalog`}>{strings.breadcrumbs.catalog}</a></li>
                        <li aria-current="page">{tag}</li>
                    </ol>
                </nav>
                <h1>{heading}</h1>
                <CatalogGrid documents={documents} lang={lang} emptyLabel={strings.empty} />
            </main>
        </>
    )
}
