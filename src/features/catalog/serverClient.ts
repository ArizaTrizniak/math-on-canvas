import { documentsApiBaseUrl } from './config'
import type { CatalogDocumentMeta, CatalogListParams, CatalogListResult } from './types'

function buildQuery(params: CatalogListParams): string {
  const q = new URLSearchParams()
  if (params.limit) q.set('limit', String(params.limit))
  if (params.cursor) q.set('cursor', params.cursor)
  if (params.category) q.set('category', params.category)
  if (params.subjects && params.subjects.length) q.set('subjects', params.subjects.join(','))
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

/** The documents service could not answer (network error, 5xx, unexpected status). Never a "not found". */
export class CatalogUnavailableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'CatalogUnavailableError'
  }
}

/**
 * Metadata-only read for SSR document pages.
 * Returns null only when the document does not exist (404) or is not public.
 * Throws CatalogUnavailableError on network errors / 5xx / unexpected statuses, so callers
 * never turn an outage into a cacheable redirect or 404.
 */
export async function getPublicDocumentMeta(documentId: string): Promise<CatalogDocumentMeta | null> {
  let res: Response
  try {
    res = await fetch(`${documentsApiBaseUrl()}/catalog/documents/${encodeURIComponent(documentId)}/meta`, {
      next: { revalidate: 300, tags: ['catalog', `catalog:doc:${documentId}`] },
    })
  } catch (cause) {
    throw new CatalogUnavailableError('Documents service unreachable', { cause })
  }
  if (res.status === 404) return null
  if (!res.ok) throw new CatalogUnavailableError(`Documents service responded ${res.status}`)
  const meta = (await res.json()) as CatalogDocumentMeta
  return meta.visibility === 'public' ? meta : null
}
