import type { DocumentSummary } from '../types'
import { CatalogCard } from './CatalogCard'

interface Props {
  documents: DocumentSummary[]
  lang: string
  label: string
}

export function RelatedRow({ documents, lang, label }: Props) {
  if (documents.length === 0) return null

  const visible = documents.slice(0, 6)

  return (
    <section className="catalog-related">
      <h2 className="catalog-related__heading">{label}</h2>
      <div className="catalog-related__row">
        {visible.map((doc) => (
          <CatalogCard key={doc.documentId} doc={doc} lang={lang} />
        ))}
      </div>
    </section>
  )
}
