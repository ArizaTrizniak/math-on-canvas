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
  language: string
  thumbnailS3Key: string | null
  likesCount: number
  viewsCount: number
  metadata: DocumentMetadata
  size: number
  createdAt: string
  updatedAt: string
}

export interface CatalogDocumentMeta extends DocumentSummary {
  description: string | null
  titleI18n: Record<string, string> | null
  descriptionI18n: Record<string, string> | null
  visibility: 'private' | 'public' | 'unlisted'
}

export interface CatalogListResult {
  documents: DocumentSummary[]
  nextCursor: string | null
}

export interface CatalogListParams {
  limit?: number
  cursor?: string
  category?: string
  tags?: string[]
  language?: string
  sort?: 'updatedAt' | 'likesCount' | 'viewsCount'
}
