import { describe, it, expect, vi, beforeEach } from 'vitest'

const listPublicDocumentsMock = vi.fn()

vi.mock('@/features/catalog/serverClient', () => ({
  listPublicDocuments: (...args: unknown[]) => listPublicDocumentsMock(...args),
}))

import { generateMetadata } from './page'

beforeEach(() => {
  listPublicDocumentsMock.mockReset()
})

describe('CategoryHubPage generateMetadata', () => {
  it('queries by subjects and omits noindex when category has documents', async () => {
    listPublicDocumentsMock.mockResolvedValue({
      documents: [{ documentId: 'd1' }],
      nextCursor: null,
    })

    const meta = await generateMetadata({ params: Promise.resolve({ lang: 'en', category: 'geometry' }) })

    expect(listPublicDocumentsMock).toHaveBeenCalledWith({ subjects: ['geometry'], limit: 24 })
    expect(meta.robots).toBeUndefined()
  })

  it('sets robots noindex when category has zero documents', async () => {
    listPublicDocumentsMock.mockResolvedValue({
      documents: [],
      nextCursor: null,
    })

    const meta = await generateMetadata({ params: Promise.resolve({ lang: 'en', category: 'calculus' }) })

    expect(listPublicDocumentsMock).toHaveBeenCalledWith({ subjects: ['calculus'], limit: 24 })
    expect(meta.robots).toEqual({ index: false })
  })
})
