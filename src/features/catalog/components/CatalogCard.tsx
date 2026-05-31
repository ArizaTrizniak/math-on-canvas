import Link from 'next/link'
import Image from 'next/image'
import { buildSlug } from '../slug'
import type { DocumentSummary } from '../types'
import './CatalogCard.css'

interface Props {
  doc: DocumentSummary
  lang: string
}

export function CatalogCard({ doc, lang }: Props) {
  const slug = buildSlug(doc.title, doc.documentId)
  const href = `/${lang}/catalog/${slug}`
  const thumbnailUrl = doc.thumbnailS3Key
    ? `${process.env.NEXT_PUBLIC_DOCUMENTS_CDN_BASE_URL ?? ''}/${doc.thumbnailS3Key}`
    : null

  return (
    <Link href={href} className="catalog-card">
      <div className="catalog-card__thumbnail">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={doc.title}
            fill
            sizes="(min-width: 1400px) 220px, (min-width: 900px) 20vw, 220px"
            className="catalog-card__thumbnail-img"
          />
        ) : (
          <div className="catalog-card__thumbnail-placeholder" aria-hidden="true" />
        )}
      </div>

      <div className="catalog-card__body">
        <p className="catalog-card__title">{doc.title}</p>

        <div className="catalog-card__badges">
          <span className="catalog-card__badge catalog-card__badge--lang">{doc.language}</span>
          {doc.category && (
            <span className="catalog-card__badge catalog-card__badge--category">{doc.category}</span>
          )}
        </div>

        <div className="catalog-card__stats">
          <span className="catalog-card__stat" title="Views">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {doc.viewsCount}
          </span>
          <span className="catalog-card__stat" title="Likes">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {doc.likesCount}
          </span>
        </div>
      </div>
    </Link>
  )
}
