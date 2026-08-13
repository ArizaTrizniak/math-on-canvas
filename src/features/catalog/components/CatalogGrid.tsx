import type { DocumentSummary } from '../types'
import { CatalogCard } from './CatalogCard'
import './CatalogGrid.css'

interface Props {
  documents: DocumentSummary[]
  lang: string
  emptyLabel: string
}

export function CatalogGrid({ documents, lang, emptyLabel }: Props) {
  if (documents.length === 0) {
    return (
      <div className="catalog-grid__empty">
        <p className="catalog-grid__empty-label">{emptyLabel}</p>
      </div>
    )
  }

  return (
    <div className="catalog-grid">
      {documents.map((doc) => (
        <CatalogCard key={doc.documentId} doc={doc} lang={lang} />
      ))}
    </div>
  )
}
