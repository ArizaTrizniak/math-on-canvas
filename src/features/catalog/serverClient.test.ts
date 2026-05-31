import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { listPublicDocuments, getPublicDocumentMeta } from './serverClient'

const fetchMock = vi.fn()

beforeEach(() => {
  process.env.DOCUMENTS_API_URL = 'https://api.example.com'
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})
afterEach(() => vi.unstubAllGlobals())

function ok(body: unknown) {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response)
}

describe('serverClient.listPublicDocuments', () => {
  it('builds the query string from params (tags joined by comma)', async () => {
    fetchMock.mockReturnValue(ok({ documents: [], nextCursor: null }))
    await listPublicDocuments({ category: 'geometry', tags: ['a', 'b'], language: 'en', sort: 'likesCount', limit: 12 })
    const url = fetchMock.mock.calls[0]![0] as string
    expect(url).toContain('/catalog/documents?')
    expect(url).toContain('category=geometry')
    expect(url).toContain('tags=a%2Cb')
    expect(url).toContain('language=en')
    expect(url).toContain('sort=likesCount')
    expect(url).toContain('limit=12')
  })

  it('returns an empty result on a non-ok response (degrade, never throw)', async () => {
    fetchMock.mockReturnValue(Promise.resolve({ ok: false, status: 500 } as Response))
    const res = await listPublicDocuments({})
    expect(res).toEqual({ documents: [], nextCursor: null })
  })
})

describe('serverClient.getPublicDocumentMeta', () => {
  it('returns null on 404', async () => {
    fetchMock.mockReturnValue(Promise.resolve({ ok: false, status: 404 } as Response))
    expect(await getPublicDocumentMeta('missing')).toBeNull()
  })
  it('returns the parsed meta on success', async () => {
    fetchMock.mockReturnValue(ok({ documentId: 'd1', title: 'T' }))
    const meta = await getPublicDocumentMeta('d1')
    expect(meta?.documentId).toBe('d1')
  })
})
