import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { DocumentSummary } from '@/features/catalog/types'

const listPublicDocumentsMock = vi.fn()

vi.mock('@/features/catalog/serverClient', () => ({
  listPublicDocuments: (...args: unknown[]) => listPublicDocumentsMock(...args),
}))

import sitemap from './sitemap'

const doc = (id: string, overrides: Partial<DocumentSummary> = {}): DocumentSummary => ({
  documentId: id,
  userId: 'u',
  title: `Doc ${id}`,
  tags: [],
  category: 'official-template',
  subjects: ['geometry'],
  language: 'en',
  thumbnailS3Key: `thumbnails/${id}.png`,
  likesCount: 0,
  viewsCount: 0,
  metadata: { orientation: 'portrait', pageCount: 1 },
  size: 100,
  createdAt: '2026-11-26T00:00:00Z',
  updatedAt: '2026-11-26T00:00:00Z',
  ...overrides,
})

beforeEach(() => {
  listPublicDocumentsMock.mockReset()
})

describe('sitemap', () => {
  it('uses facets.subjects when available so categories beyond the 1000-doc window are still included', async () => {
    listPublicDocumentsMock.mockResolvedValue({
      documents: [doc('g1', { subjects: ['geometry'] })],
      facets: {
        subjects: [
          { id: 'geometry', count: 7 },
          { id: 'algebra', count: 2 },
          { id: 'statistics', count: 1 },
          { id: 'calculus', count: 0 },
          { id: 'math', count: 1 },
        ],
      },
      nextCursor: null,
    })

    const entries = await sitemap()
    const urls = entries.map((e) => e.url)

    expect(urls).toContain('https://www.math-on-canvas.com/en/catalog/category/algebra')
    expect(urls).toContain('https://www.math-on-canvas.com/en/catalog/category/geometry')
    expect(urls).toContain('https://www.math-on-canvas.com/en/catalog/category/statistics')
    expect(urls).not.toContain('https://www.math-on-canvas.com/en/catalog/category/calculus')
    expect(urls).not.toContain('https://www.math-on-canvas.com/en/catalog/category/math')
  })

  it('falls back to document subjects when facets are absent and ignores legacy category', async () => {
    listPublicDocumentsMock.mockResolvedValue({
      documents: [
        doc('g1', { subjects: ['geometry'] }),
        doc('a1', { subjects: ['algebra', 'math'] }),
        doc('legacy', { category: 'calculus', subjects: [] }),
      ],
      nextCursor: null,
    })

    const entries = await sitemap()
    const urls = entries.map((e) => e.url)

    expect(urls).toContain('https://www.math-on-canvas.com/en/catalog/category/algebra')
    expect(urls).toContain('https://www.math-on-canvas.com/en/catalog/category/geometry')
    expect(urls).not.toContain('https://www.math-on-canvas.com/en/catalog/category/calculus')
    expect(urls).not.toContain('https://www.math-on-canvas.com/en/catalog/category/official-template')
  })

  it('degrades to landing and pricing without catalog entries when API returns degraded', async () => {
    listPublicDocumentsMock.mockResolvedValue({
      documents: [],
      nextCursor: null,
      degraded: true,
    })

    const entries = await sitemap()
    const urls = entries.map((e) => e.url)

    expect(urls).toContain('https://www.math-on-canvas.com/en')
    expect(urls).toContain('https://www.math-on-canvas.com/en/pricing')
    expect(urls.some((u) => u.includes('/catalog'))).toBe(false)
  })
})
