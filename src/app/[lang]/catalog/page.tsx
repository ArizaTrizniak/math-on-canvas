import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { BASE_URL, OG_IMAGE } from '@/lib/site'
import { LANGUAGES } from '@/lib/i18n/constants'
import { listPublicDocuments } from '@/features/catalog/serverClient'
import { CatalogGrid } from '@/features/catalog/components/CatalogGrid'
import { FilterBar } from '@/features/catalog/components/FilterBar'
import { hreflangAlternates } from '@/features/catalog/seo/metadata'
import { collectionPage } from '@/features/catalog/seo/jsonld'
import { buildSlug } from '@/features/catalog/slug'
import type { CatalogListParams } from '@/features/catalog/types'
import { getCatalogStrings } from '@/features/catalog/i18n'

export const revalidate = 300

export async function generateMetadata({
    params,
}: {
    params: Promise<{ lang: string }>
}): Promise<Metadata> {
    const { lang } = await params
    const strings = getCatalogStrings(lang)
    const canonical = `${BASE_URL}/${lang}/catalog`

    return {
        title: strings.meta.hubTitle,
        description: strings.meta.hubDescription,
        alternates: {
            canonical,
            languages: hreflangAlternates('/catalog'),
        },
        openGraph: {
            title: strings.meta.hubTitle,
            description: strings.meta.hubDescription,
            url: canonical,
            siteName: 'Math on Canvas',
            type: 'website',
            images: [OG_IMAGE],
        },
    }
}

export default async function CatalogHubPage({
    params,
    searchParams,
}: {
    params: Promise<{ lang: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { lang } = await params
    const isValid = LANGUAGES.some(l => l.code === lang)
    if (!isValid) notFound()

    const sp = await searchParams

    const category = typeof sp.category === 'string' ? sp.category : undefined
    const tagsRaw = typeof sp.tags === 'string'
        ? sp.tags
        : Array.isArray(sp.tags) ? sp.tags.join(',') : undefined
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : undefined
    const language = typeof sp.language === 'string' ? sp.language : undefined
    const sortRaw = typeof sp.sort === 'string' ? sp.sort : undefined
    const sort = (sortRaw === 'updatedAt' || sortRaw === 'likesCount' || sortRaw === 'viewsCount')
        ? sortRaw as CatalogListParams['sort']
        : undefined

    const [mainResult, popularResult] = await Promise.all([
        listPublicDocuments({ category, tags, language, sort, limit: 24 }),
        listPublicDocuments({ sort: 'likesCount', limit: 6 }),
    ])

    const main = mainResult.documents
    const popular = popularResult.documents

    const strings = getCatalogStrings(lang)

    const pageUrl = `${BASE_URL}/${lang}/catalog`
    const jsonLd = collectionPage({
        name: strings.hubHeadline,
        url: pageUrl,
        itemUrls: main.map(doc => `${BASE_URL}/${lang}/catalog/${buildSlug(doc.title, doc.documentId)}`),
    })

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <main>
                <h1>{strings.hubHeadline}</h1>
                <p>{strings.hubIntro}</p>

                <section>
                    <h2>{strings.popular}</h2>
                    <CatalogGrid documents={popular} lang={lang} emptyLabel={strings.empty} />
                </section>

                <Suspense fallback={<div className="catalog-filter" aria-hidden="true" />}>
                    <FilterBar lang={lang} />
                </Suspense>

                <CatalogGrid documents={main} lang={lang} emptyLabel={strings.empty} />
            </main>
        </>
    )
}
