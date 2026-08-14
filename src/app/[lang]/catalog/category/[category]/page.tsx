import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { BASE_URL } from '@/lib/site'
import { LANGUAGES } from '@/lib/i18n/constants'
import { listPublicDocuments } from '@/features/catalog/serverClient'
import { CatalogGrid } from '@/features/catalog/components/CatalogGrid'
import { isCategory } from '@/features/catalog/taxonomy'
import { buildSlug } from '@/features/catalog/slug'
import { hreflangAlternates } from '@/features/catalog/seo/metadata'
import { collectionPage, breadcrumbList } from '@/features/catalog/seo/jsonld'
import { getCatalogStrings, getCategoryLabel } from '@/features/catalog/i18n'

export const revalidate = 300

export async function generateMetadata({
    params,
}: {
    params: Promise<{ lang: string; category: string }>
}): Promise<Metadata> {
    const { lang, category } = await params
    const categoryLabel = getCategoryLabel(category, lang)
    const strings = getCatalogStrings(lang)
    const canonical = `${BASE_URL}/${lang}/catalog/category/${category}`

    const title = strings.categoryHub.metaTitle.replaceAll('{category}', categoryLabel)
    const description = strings.categoryHub.metaDescription.replaceAll('{category}', categoryLabel)

    return {
        title,
        description,
        alternates: {
            canonical,
            languages: hreflangAlternates(`/catalog/category/${category}`),
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

export default async function CategoryHubPage({
    params,
}: {
    params: Promise<{ lang: string; category: string }>
}) {
    const { lang, category } = await params

    const isValidLang = LANGUAGES.some(l => l.code === lang)
    if (!isValidLang) notFound()
    if (!isCategory(category)) notFound()

    const result = await listPublicDocuments({ category, limit: 24 })
    const documents = result.documents

    const strings = getCatalogStrings(lang)
    const categoryLabel = getCategoryLabel(category, lang)
    const heading = strings.categoryHub.heading.replaceAll('{category}', categoryLabel)

    const canonical = `${BASE_URL}/${lang}/catalog/category/${category}`

    const jsonLdCollection = collectionPage({
        name: heading,
        url: canonical,
        itemUrls: documents.map(doc => `${BASE_URL}/${lang}/catalog/${buildSlug(doc.title, doc.documentId)}`),
    })

    const jsonLdBreadcrumb = breadcrumbList([
        { name: strings.breadcrumbs.home, url: `${BASE_URL}/${lang}` },
        { name: strings.breadcrumbs.catalog, url: `${BASE_URL}/${lang}/catalog` },
        { name: categoryLabel, url: canonical },
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
                        <li aria-current="page">{categoryLabel}</li>
                    </ol>
                </nav>
                <h1>{heading}</h1>
                <CatalogGrid documents={documents} lang={lang} emptyLabel={strings.empty} />
            </main>
        </>
    )
}
