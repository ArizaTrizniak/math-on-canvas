import Link from 'next/link'
import { buildSlug } from '../slug'
import { buildThumbnailUrl } from '../thumbnail'
import { getCatalogStrings, getCategoryLabel } from '../i18n'
import { categoryGlyph } from '../taxonomy'
import { formatCompactCount, formatSheet, sheetOrientation } from '../format'
import type { DocumentSummary } from '../types'
import { OpenInEditorCTA } from './OpenInEditorCTA'
import './CatalogCard.css'

interface Props {
  doc: DocumentSummary
  lang: string
}

const MAX_TAGS = 3

export function CatalogCard({ doc, lang }: Props) {
  const strings = getCatalogStrings(lang)
  const href = `/${lang}/catalog/${buildSlug(doc.title, doc.documentId)}`
  const thumbnailUrl = buildThumbnailUrl(doc.thumbnailS3Key)
  const orientation = sheetOrientation(doc.metadata)
  const sheet = formatSheet(doc.metadata, strings.stats.pages)
  const glyph = categoryGlyph(doc.category)
  const tags = (doc.tags ?? []).slice(0, MAX_TAGS)

  return (
    <article className="catalog-card">
      <div className="catalog-card__thumb">
        <div className={`catalog-card__sheet catalog-card__sheet--${orientation}`}>
          {thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary external thumbnail URL; next/image remotePatterns not configured for the documents CDN
            <img
              src={thumbnailUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className="catalog-card__img"
            />
          ) : (
            <span className="catalog-card__placeholder" aria-hidden="true">{glyph}</span>
          )}
        </div>

        {doc.category && (
          <span className="catalog-card__category">
            <span className="catalog-card__glyph" aria-hidden="true">{glyph}</span>
            {getCategoryLabel(doc.category, lang)}
          </span>
        )}
        {doc.language && doc.language !== lang && (
          <span className="catalog-card__lang" title={strings.docLanguage}>
            {doc.language.toUpperCase()}
          </span>
        )}

        <div className="catalog-card__veil">
          <OpenInEditorCTA
            className="catalog-card__open"
            documentId={doc.documentId}
            title={doc.title}
            thumbnailUrl={thumbnailUrl}
            label={strings.open}
            intro={strings.gateIntro}
          />
        </div>
      </div>

      <div className="catalog-card__body">
        <Link href={href} className="catalog-card__link">
          {doc.title}
        </Link>

        {tags.length > 0 && (
          <ul className="catalog-card__tags">
            {tags.map((tag) => (
              <li key={tag}>
                <Link href={`/${lang}/catalog/tag/${encodeURIComponent(tag)}`} className="catalog-card__tag">
                  #{tag}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="catalog-card__footer">
          <span className="catalog-card__stats">
            <span className="catalog-card__stat" aria-label={`${strings.stats.views}: ${doc.viewsCount}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span aria-hidden="true">{formatCompactCount(doc.viewsCount, lang)}</span>
            </span>
            <span className="catalog-card__stat" aria-label={`${strings.stats.likes}: ${doc.likesCount}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span aria-hidden="true">{formatCompactCount(doc.likesCount, lang)}</span>
            </span>
          </span>
          {sheet && <span className="catalog-card__sheet-label">{sheet}</span>}
        </div>
      </div>
    </article>
  )
}
