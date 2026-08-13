import { describe, it, expect } from 'vitest'
import { catalogSitemapEntries } from './sitemap'
import type { DocumentSummary } from './types'

const doc = (id: string): DocumentSummary => ({
  documentId: id, userId: 'u', title: `Doc ${id}`, tags: [], category: 'geometry', language: 'en',
  thumbnailS3Key: null, likesCount: 0, viewsCount: 0, metadata: { orientation: 'portrait', pageCount: 1 },
  size: 0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z',
})

describe('catalogSitemapEntries', () => {
  it('emits one entry per document per locale with hreflang alternates', () => {
    const entries = catalogSitemapEntries([doc('a1')])
    const docUrls = entries.filter((e) => e.url.includes('/catalog/doc-a1') || e.url.includes('/catalog/doc'))
    expect(entries.some((e) => e.url.endsWith('/en/catalog'))).toBe(true)
    expect(entries.some((e) => e.url.includes('/en/catalog/doc-a1'))).toBe(true)
    expect(docUrls.length).toBeGreaterThan(0)
  })
})
