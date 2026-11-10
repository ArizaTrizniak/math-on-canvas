import Link from 'next/link'
import { buildSlug } from '../slug'
import { getCategoryLabel } from '../i18n'
import { formatCompactCount } from '../format'
import type { DocumentSummary } from '../types'
import './TopRanked.css'

interface Props {
  documents: DocumentSummary[]
  lang: string
  title: string
  seeAllHref: string
  seeAllLabel: string
  likesLabel: string
}

const RANKED = 3

/** Short ranked list of the most liked documents, shown above the filters. */
export function TopRanked({ documents, lang, title, seeAllHref, seeAllLabel, likesLabel }: Props) {
  const top = documents.slice(0, RANKED)
  if (top.length === 0) return null

  return (
    <section className="catalog-top" aria-labelledby="catalog-top-title">
      <div className="catalog-top__head">
        <h2 id="catalog-top-title" className="catalog-top__title">{title}</h2>
        <Link href={seeAllHref} className="catalog-top__all">{seeAllLabel} →</Link>
      </div>
      <ol className="catalog-top__list">
        {top.map((doc, i) => (
          <li key={doc.documentId}>
            <Link href={`/${lang}/catalog/${buildSlug(doc.title, doc.documentId)}`} className="catalog-top__item">
              <span className="catalog-top__rank" aria-hidden="true">{i + 1}</span>
              <span className="catalog-top__text">
                <span className="catalog-top__name">{doc.title}</span>
                <span className="catalog-top__meta">
                  {doc.category && <span>{getCategoryLabel(doc.category, lang)}</span>}
                  <span className="catalog-top__likes">
                    <span className="catalog-sr-only">{`${likesLabel}: ${doc.likesCount}`}</span>
                    <span aria-hidden="true">♥ {formatCompactCount(doc.likesCount, lang)}</span>
                  </span>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
