import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { BASE_URL, OG_IMAGE } from '@/lib/site'
import Link from 'next/link'
import { LANGUAGES, type LanguageCode } from '@/lib/i18n/constants'
import { listPublicDocuments } from '@/features/catalog/serverClient'
import { CatalogGrid } from '@/features/catalog/components/CatalogGrid'
import { CATEGORIES, categoryGlyph, isCategory } from '@/features/catalog/taxonomy'
import { CatalogShell } from '@/features/catalog/components/CatalogShell'
import { RememberListUrl } from '@/features/catalog/components/RememberListUrl'
import { Suspense } from 'react'
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
            images: [OG_IMAGE],
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
            <CatalogShell lang={lang as LanguageCode} pathSuffix={`/catalog/category/${category}`}>
                <Suspense fallback={null}><RememberListUrl /></Suspense>
                <nav aria-label="Breadcrumb">
                    <ol>
                        <li><a href={`/${lang}`}>{strings.breadcrumbs.home}</a></li>
                        <li><a href={`/${lang}/catalog`}>{strings.breadcrumbs.catalog}</a></li>
                        <li aria-current="page">{categoryLabel}</li>
                    </ol>
                </nav>
                <div className="catalog-hub-head">
                    <span className="catalog-hub-head__glyph" aria-hidden="true">{categoryGlyph(category)}</span>
                    <h1 className="catalog-hub-head__title">{heading}</h1>
                </div>
                <CatalogGrid documents={documents} lang={lang} empty={{ title: strings.emptyState.title, body: strings.emptyState.body, resetLabel: strings.filters.reset, createLabel: strings.emptyState.create }} />
                <section className="catalog-hub-more" aria-labelledby="catalog-hub-more-title">
                    <h2 id="catalog-hub-more-title" className="catalog-hub-more__title">{strings.otherCategories}</h2>
                    <ul className="catalog-hub-more__list">
                        {CATEGORIES.filter(c => c !== category).map(c => (
                            <li key={c}>
                                <Link href={`/${lang}/catalog/category/${c}`} className="catalog-hub-more__link">
                                    <span className="catalog-hub-head__glyph-sm" aria-hidden="true">{categoryGlyph(c)}</span>
                                    {getCategoryLabel(c, lang)}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            </CatalogShell>
        </>
    )
}
