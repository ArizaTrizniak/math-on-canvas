import type { MetadataRoute } from 'next'
import { BASE_URL } from '@/lib/site'
import { LANGUAGES } from '@/lib/i18n/constants'
import { buildSlug } from './slug'
import { hreflangAlternates } from './seo/metadata'
import type { DocumentSummary } from './types'

function localizedEntries(path: string, lastModified: Date): MetadataRoute.Sitemap {
  return LANGUAGES.map(({ code }) => ({
    url: `${BASE_URL}/${code}${path}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    alternates: { languages: hreflangAlternates(path) },
  }))
}

/** Hub + one entry per (document × locale). Caller passes only threshold-passing documents. */
export function catalogSitemapEntries(documents: DocumentSummary[]): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [...localizedEntries('/catalog', new Date())]
  for (const doc of documents) {
    const path = `/catalog/${buildSlug(doc.title, doc.documentId)}`
    entries.push(...localizedEntries(path, new Date(doc.updatedAt)))
  }
  return entries
}
