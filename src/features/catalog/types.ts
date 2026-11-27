export interface DocumentMetadata {
  orientation: 'portrait' | 'landscape'
  pageCount: number
}

export interface DocumentSummary {
  documentId: string
  userId: string
  title: string
  tags: string[]
  category: string | null
  subjects?: string[]
  language: string
  thumbnailS3Key: string | null
  likesCount: number
  viewsCount: number
  metadata: DocumentMetadata
  size: number
  createdAt: string
  updatedAt: string
}

/** Preview of one sheet (API-1 in docs/superpowers/plans/2026-11-10-catalog-api-requirements.md). */
export interface PageThumbnail {
  index: number
  s3Key: string
  smallS3Key: string
  width: number
  height: number
}

export interface CatalogDocumentMeta extends DocumentSummary {
  description: string | null
  titleI18n: Record<string, string> | null
  descriptionI18n: Record<string, string> | null
  visibility: 'private' | 'public' | 'unlisted'
  /** Not returned by the API yet; null or absent while previews are pending. */
  pageThumbnails?: PageThumbnail[] | null
}

export interface CatalogFacetCount {
  id: string
  count: number
}

export interface CatalogFacets {
  subjects?: CatalogFacetCount[]
}

export interface CatalogListResult {
  documents: DocumentSummary[]
  nextCursor: string | null
  facets?: CatalogFacets | null
  /** True when the documents API could not be reached or returned a non-2xx status. */
  degraded?: boolean
}

export interface CatalogListParams {
  limit?: number
  cursor?: string
  category?: string
  subjects?: string[]
  tags?: string[]
  language?: string
  sort?: 'updatedAt' | 'likesCount' | 'viewsCount'
}
