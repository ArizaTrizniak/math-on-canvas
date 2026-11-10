import type { DocumentSummary } from '../types'
import { CatalogCard } from './CatalogCard'
import { CatalogEmptyState, type CatalogEmptyStateProps } from './CatalogEmptyState'
import './CatalogGrid.css'

interface Props {
  documents: DocumentSummary[]
  lang: string
  empty: CatalogEmptyStateProps
}

export function CatalogGrid({ documents, lang, empty }: Props) {
  if (documents.length === 0) return <CatalogEmptyState {...empty} />

  return (
    <div className="catalog-grid">
      {documents.map((doc) => (
        <CatalogCard key={doc.documentId} doc={doc} lang={lang} />
      ))}
    </div>
  )
}
