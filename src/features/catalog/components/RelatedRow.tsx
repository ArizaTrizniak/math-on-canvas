import Link from 'next/link'
import type { DocumentSummary } from '../types'
import { CatalogCard } from './CatalogCard'

interface Props {
  documents: DocumentSummary[]
  lang: string
  label: string
  moreHref?: string
  moreLabel?: string
}

const MAX = 6

export function RelatedRow({ documents, lang, label, moreHref, moreLabel }: Props) {
  if (documents.length === 0) return null

  return (
    <section className="catalog-related" aria-labelledby="catalog-related-title">
      <div className="catalog-related__head">
        <h2 id="catalog-related-title" className="catalog-related__heading">{label}</h2>
        {moreHref && moreLabel && (
          <Link href={moreHref} className="catalog-related__more">{moreLabel}</Link>
        )}
      </div>
      <div className="catalog-related__row">
        {documents.slice(0, MAX).map((doc) => (
          <CatalogCard key={doc.documentId} doc={doc} lang={lang} />
        ))}
      </div>
    </section>
  )
}
