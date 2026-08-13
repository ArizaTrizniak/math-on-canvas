import { documentsApiBaseUrl } from './config'
import type { CatalogDocumentMeta, CatalogListParams, CatalogListResult } from './types'

function buildQuery(params: CatalogListParams): string {
  const q = new URLSearchParams()
  if (params.limit) q.set('limit', String(params.limit))
  if (params.cursor) q.set('cursor', params.cursor)
  if (params.category) q.set('category', params.category)
  if (params.tags && params.tags.length) q.set('tags', params.tags.join(','))
  if (params.language) q.set('language', params.language)
  if (params.sort) q.set('sort', params.sort)
  return q.toString()
}

/** List public documents. Degrades to an empty result on failure (must never break the landing). */
export async function listPublicDocuments(params: CatalogListParams): Promise<CatalogListResult> {
  try {
    const qs = buildQuery(params)
    const res = await fetch(`${documentsApiBaseUrl()}/catalog/documents${qs ? `?${qs}` : ''}`, {
      next: { revalidate: 300, tags: ['catalog'] },
    })
    if (!res.ok) return { documents: [], nextCursor: null }
    return (await res.json()) as CatalogListResult
  } catch {
    return { documents: [], nextCursor: null }
  }
}

/** Metadata-only read for SSR document pages. Returns null when not found / on error. */
export async function getPublicDocumentMeta(documentId: string): Promise<CatalogDocumentMeta | null> {
  try {
    const res = await fetch(`${documentsApiBaseUrl()}/catalog/documents/${encodeURIComponent(documentId)}/meta`, {
      next: { revalidate: 300, tags: ['catalog', `catalog:doc:${documentId}`] },
    })
    if (!res.ok) return null
    return (await res.json()) as CatalogDocumentMeta
  } catch {
    return null
  }
}
