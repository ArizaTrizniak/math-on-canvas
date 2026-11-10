import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { BASE_URL, OG_IMAGE } from '@/lib/site'
import { LANGUAGES, type LanguageCode } from '@/lib/i18n/constants'
import { listPublicDocuments } from '@/features/catalog/serverClient'
import { CatalogGrid } from '@/features/catalog/components/CatalogGrid'
import { CatalogFilters } from '@/features/catalog/components/CatalogFilters'
import { hreflangAlternates } from '@/features/catalog/seo/metadata'
import { collectionPage } from '@/features/catalog/seo/jsonld'
import { buildSlug } from '@/features/catalog/slug'
import type { CatalogListParams } from '@/features/catalog/types'
import { getCatalogStrings } from '@/features/catalog/i18n'
import { CATEGORIES } from '@/features/catalog/taxonomy'
import { buildCatalogHref, clearFiltersHref, hasActiveFilters, parseTags } from '@/features/catalog/filterParams'
import { CatalogShell } from '@/features/catalog/components/CatalogShell'
import { TopRanked } from '@/features/catalog/components/TopRanked'
import { CatalogPagination } from '@/features/catalog/components/CatalogPagination'

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

const SORTS = ['updatedAt', 'likesCount', 'viewsCount'] as const

function toSearchParams(sp: { [key: string]: string | string[] | undefined }): URLSearchParams {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(sp)) {
        if (typeof value === 'string') params.set(key, value)
        else if (Array.isArray(value)) value.forEach((v) => params.append(key, v))
    }
    return params
}

export default async function CatalogHubPage({
    params,
    searchParams,
}: {
    params: Promise<{ lang: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { lang: rawLang } = await params
    if (!LANGUAGES.some(l => l.code === rawLang)) notFound()
    const lang = rawLang as LanguageCode

    const sp = await searchParams
    const current = toSearchParams(sp)
    const pathname = `/${lang}/catalog`

    const category = current.get('category') || undefined
    const tags = parseTags(current.getAll('tags'))
    const language = current.get('language') || undefined
    const sortRaw = current.get('sort')
    const sort = SORTS.find((s) => s === sortRaw) as CatalogListParams['sort']
    const cursor = current.get('cursor') || undefined
    const filtered = hasActiveFilters(current)
    const showTop = !filtered && !cursor

    const [mainResult, topResult] = await Promise.all([
        listPublicDocuments({ category, tags: tags.length ? tags : undefined, language, sort, cursor, limit: 24 }),
        showTop ? listPublicDocuments({ sort: 'likesCount', limit: 3 }) : Promise.resolve(null),
    ])
    const main = mainResult.documents

    const strings = getCatalogStrings(lang)

    const pageUrl = `${BASE_URL}${pathname}`
    const jsonLd = collectionPage({
        name: strings.hubHeadline,
        url: pageUrl,
        itemUrls: main.map(doc => `${BASE_URL}/${lang}/catalog/${buildSlug(doc.title, doc.documentId)}`),
    })

    const results = (
        <>
            <CatalogGrid
                documents={main}
                lang={lang}
                empty={{
                    title: strings.emptyState.title,
                    body: strings.emptyState.body,
                    resetHref: filtered ? clearFiltersHref(pathname, current) : undefined,
                    resetLabel: strings.filters.reset,
                    createLabel: strings.emptyState.create,
                }}
            />
            <CatalogPagination
                nextHref={mainResult.nextCursor ? buildCatalogHref(pathname, current, { cursor: mainResult.nextCursor }) : null}
                firstHref={cursor ? buildCatalogHref(pathname, current, { cursor: null }) : null}
                nextLabel={strings.pagination.next}
                firstLabel={strings.pagination.first}
                label={strings.pagination.label}
            />
        </>
    )

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <CatalogShell lang={lang} pathSuffix="/catalog">
                <section className="catalog-hero">
                    <span className="catalog-hero__pill">
                        {strings.hubPill.replace('{count}', String(CATEGORIES.length))}
                    </span>
                    <h1 className="catalog-hero__title">{strings.hubHeadline}</h1>
                    <p className="catalog-hero__intro">{strings.hubIntro}</p>
                </section>

                {topResult && (
                    <TopRanked
                        documents={topResult.documents}
                        lang={lang}
                        title={strings.topRanked}
                        seeAllHref={buildCatalogHref(pathname, current, { sort: 'likesCount' })}
                        seeAllLabel={strings.seeAll}
                        likesLabel={strings.stats.likes}
                    />
                )}

                {/* The route is dynamic (awaits searchParams), so useSearchParams does not suspend
                    and this fallback is not expected to render; keep it light. */}
                <Suspense fallback={<div className="catalog-filters catalog-filters--placeholder" aria-hidden="true" />}>
                    <CatalogFilters lang={lang}>{results}</CatalogFilters>
                </Suspense>
            </CatalogShell>
        </>
    )
}
