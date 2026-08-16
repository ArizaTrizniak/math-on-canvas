import type { MetadataRoute } from 'next'
import { BASE_URL } from '@/lib/site'
import { listPublicDocuments } from '@/features/catalog/serverClient'
import { catalogSitemapEntries } from '@/features/catalog/sitemap'
import type { DocumentSummary } from '@/features/catalog/types'
import { LANGUAGES } from '@/lib/i18n/constants'
import { CATEGORIES } from '@/features/catalog/taxonomy'

const MAX_PAGES = 10
const PAGE_SIZE = 100

async function fetchAllCatalogDocuments(): Promise<DocumentSummary[]> {
    const all: DocumentSummary[] = []
    let cursor: string | undefined = undefined
    for (let page = 0; page < MAX_PAGES; page++) {
        const result = await listPublicDocuments({ limit: PAGE_SIZE, cursor })
        all.push(...result.documents)
        if (!result.nextCursor) break
        cursor = result.nextCursor
    }
    return all
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
    // Static routes that exist regardless of whether the catalog API answers:
    // the landing, pricing, and one hub per category (all linked from the
    // landing footer, so they must be discoverable here too).
    const staticEntries: MetadataRoute.Sitemap = [
        ...localeEntries('', { priority: 1.0 }),
        ...localeEntries('/pricing', { priority: 0.8 }),
        ...CATEGORIES.flatMap((category) =>
            localeEntries(`/catalog/category/${category}`, { priority: 0.7 }),
        ),
    ]

    try {
        const allDocs = await fetchAllCatalogDocuments()
        const indexableDocs = allDocs.filter((d) => d.thumbnailS3Key)
        const catalogEntries = catalogSitemapEntries(indexableDocs)
        return [...staticEntries, ...catalogEntries]
    } catch {
        return staticEntries
    }
}
