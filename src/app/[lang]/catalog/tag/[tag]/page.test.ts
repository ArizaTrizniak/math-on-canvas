import { describe, it, expect, vi, beforeEach } from 'vitest'

const listPublicDocumentsMock = vi.fn()

vi.mock('@/features/catalog/serverClient', () => ({
  listPublicDocuments: (...args: unknown[]) => listPublicDocumentsMock(...args),
}))

import { generateMetadata } from './page'

beforeEach(() => {
  listPublicDocumentsMock.mockReset()
})

describe('TagHubPage generateMetadata', () => {
  it('omits noindex when tag has enough documents', async () => {
    listPublicDocumentsMock.mockResolvedValue({
      documents: [{ documentId: 'd1' }, { documentId: 'd2' }, { documentId: 'd3' }],
      nextCursor: null,
    })

    const meta = await generateMetadata({ params: Promise.resolve({ lang: 'en', tag: 'triangles' }) })

    expect(meta.robots).toBeUndefined()
  })

  it('sets robots noindex when tag is thin', async () => {
    listPublicDocumentsMock.mockResolvedValue({
      documents: [{ documentId: 'd1' }],
      nextCursor: null,
    })

    const meta = await generateMetadata({ params: Promise.resolve({ lang: 'en', tag: 'rare' }) })

    expect(meta.robots).toEqual({ index: false })
  })

  it('keeps tag page indexable when API call is degraded', async () => {
    listPublicDocumentsMock.mockResolvedValue({
      documents: [],
      nextCursor: null,
      degraded: true,
    })

    const meta = await generateMetadata({ params: Promise.resolve({ lang: 'en', tag: 'triangles' }) })

    expect(meta.robots).toBeUndefined()
  })
})
