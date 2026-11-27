import type { MetadataRoute } from 'next'
import { BASE_URL } from '@/lib/site'
import { listPublicDocuments } from '@/features/catalog/serverClient'
import { catalogSitemapEntries } from '@/features/catalog/sitemap'
import type { CatalogFacets, DocumentSummary } from '@/features/catalog/types'
import { LANGUAGES } from '@/lib/i18n/constants'
import { activeCategories, activeCategoriesFromFacets } from '@/features/catalog/taxonomy'

const MAX_PAGES = 10
const PAGE_SIZE = 100

async function fetchAllCatalogDocuments(): Promise<{
    documents: DocumentSummary[]
    facets: CatalogFacets | null
    degraded: boolean
}> {
    const all: DocumentSummary[] = []
    let facets: CatalogFacets | null = null
    let cursor: string | undefined = undefined
    for (let page = 0; page < MAX_PAGES; page++) {
        const result = await listPublicDocuments({ limit: PAGE_SIZE, cursor })
        if (result.degraded) return { documents: [], facets: null, degraded: true }
        if (page === 0) facets = result.facets ?? null
        all.push(...result.documents)
        if (!result.nextCursor) break
        cursor = result.nextCursor
    }
    return { documents: all, facets, degraded: false }
}

/**
 * One entry per (locale × path), each carrying the full hreflang cluster.
 * x-default is included so the sitemap agrees with the <head> alternates —
 * a mismatch between the two is a common cause of hreflang being ignored.
 */
function localeEntries(
    path: string,
    { priority, changeFrequency = 'weekly' as const }: {
        priority: number
        changeFrequency?: 'weekly' | 'monthly'
    },
): MetadataRoute.Sitemap {
    const languages: Record<string, string> = Object.fromEntries(
        LANGUAGES.map(({ code }) => [code, `${BASE_URL}/${code}${path}`]),
    )
    languages['x-default'] = `${BASE_URL}/en${path}`

    return LANGUAGES.map(({ code }) => ({
        url: `${BASE_URL}/${code}${path}`,
        lastModified: new Date(),
        changeFrequency,
        priority,
        alternates: { languages },
    }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Static routes that exist regardless of whether the catalog API answers.
    const staticEntries: MetadataRoute.Sitemap = [
        ...localeEntries('', { priority: 1.0 }),
        ...localeEntries('/pricing', { priority: 0.8 }),
    ]

    try {
        const { documents: allDocs, facets, degraded } = await fetchAllCatalogDocuments()
        if (degraded) return staticEntries
        const categories = activeCategoriesFromFacets(facets) ?? activeCategories(allDocs)
        const categoryEntries = categories.flatMap((category) =>
            localeEntries(`/catalog/category/${category}`, { priority: 0.7 }),
        )
        const indexableDocs = allDocs.filter((d) => d.thumbnailS3Key)
        const catalogEntries = catalogSitemapEntries(indexableDocs)
        return [...staticEntries, ...categoryEntries, ...catalogEntries]
    } catch {
        return staticEntries
    }
}
