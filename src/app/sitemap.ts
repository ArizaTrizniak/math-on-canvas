import type { MetadataRoute } from 'next'
import { BASE_URL } from '@/lib/site'
import { listPublicDocuments } from '@/features/catalog/serverClient'
import { catalogSitemapEntries } from '@/features/catalog/sitemap'
import type { DocumentSummary } from '@/features/catalog/types'
import { LANGUAGES } from '@/lib/i18n/constants'

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const homeEntries: MetadataRoute.Sitemap = LANGUAGES.map(({ code }) => ({
        url: `${BASE_URL}/${code}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 1.0,
        alternates: {
            languages: Object.fromEntries(
                LANGUAGES.map(({ code: c }) => [c, `${BASE_URL}/${c}`])
            ),
        },
    }))

    try {
        const allDocs = await fetchAllCatalogDocuments()
        const indexableDocs = allDocs.filter((d) => d.thumbnailS3Key)
        const catalogEntries = catalogSitemapEntries(indexableDocs)
        return [...homeEntries, ...catalogEntries]
    } catch {
        return homeEntries
    }
}
