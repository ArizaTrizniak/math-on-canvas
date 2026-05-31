import type { MetadataRoute } from 'next'
import { BASE_URL } from '@/lib/site'
import { listPublicDocuments } from '@/features/catalog/serverClient'
import { catalogSitemapEntries } from '@/features/catalog/sitemap'
import type { DocumentSummary } from '@/features/catalog/types'

const LANGUAGES = ['en', 'ru', 'es', 'de'] as const

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
    const homeEntries: MetadataRoute.Sitemap = LANGUAGES.map((lang) => ({
        url: `${BASE_URL}/${lang}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 1.0,
        alternates: {
            languages: Object.fromEntries(
                LANGUAGES.map((l) => [l, `${BASE_URL}/${l}`])
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
