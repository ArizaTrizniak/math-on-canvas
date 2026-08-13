import Link from 'next/link'
import type { CatalogDocumentMeta, DocumentSummary } from '../types'
import { OpenInEditorCTA } from './OpenInEditorCTA'
import { ViewBeacon } from './ViewBeacon'
import { RelatedRow } from './RelatedRow'
import { ShareButton } from './ShareButton'
import { buildThumbnailUrl } from '../thumbnail'
import './DocumentView.css'

interface Strings {
  open: string
  share: string
  gateIntro: string
  related: string
}

interface Props {
  doc: CatalogDocumentMeta
  lang: string
  related: DocumentSummary[]
  strings: Strings
}

export function DocumentView({ doc, lang, related, strings }: Props) {
  const thumbnailUrl = buildThumbnailUrl(doc.thumbnailS3Key)

  const pageCount = doc.metadata.pageCount

  return (
    <>
      <div className="catalog-doc">
        <h1 className="catalog-doc__title">{doc.title}</h1>

        {/* ── Left column: preview + page strip ── */}
        <div className="catalog-doc__left">
          <div className="catalog-doc__preview">
            {thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- arbitrary external thumbnail URL; next/image remotePatterns not configured for the documents CDN
              <img
                src={thumbnailUrl}
                alt={doc.title}
                loading="eager"
                decoding="async"
                className="catalog-doc__preview-img"
              />
            ) : (
              <div className="catalog-doc__preview-placeholder" aria-hidden="true" />
            )}
          </div>

          {pageCount > 1 && (
            <div className="catalog-doc__strip" aria-label="Page thumbnails">
              {/* First page uses the actual thumbnail */}
              <div className="catalog-doc__strip-cell catalog-doc__strip-cell--first">
                {thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- arbitrary external thumbnail URL; next/image remotePatterns not configured for the documents CDN
                  <img
                    src={thumbnailUrl}
                    alt="Page 1"
                    className="catalog-doc__strip-img"
                  />
                ) : (
                  <span>1</span>
                )}
              </div>

              {/* Remaining pages as numbered placeholder cells */}
              {Array.from({ length: pageCount - 1 }, (_, i) => (
                <div key={i + 2} className="catalog-doc__strip-cell">
                  {i + 2}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right sticky rail ── */}
        <aside className="catalog-doc__rail">
          {/* Badges */}
          <div className="catalog-doc__badges">
            {doc.category && (
              <Link
                href={`/${lang}/catalog/category/${doc.category}`}
                className="catalog-doc__badge catalog-doc__badge--category"
              >
                {doc.category}
              </Link>
            )}
            <span className="catalog-doc__badge catalog-doc__badge--lang">{doc.language}</span>
          </div>

          {/* Metadata */}
          <dl className="catalog-doc__meta">
            <div className="catalog-doc__meta-row">
              <dt className="catalog-doc__meta-label">Orientation</dt>
              <dd className="catalog-doc__meta-value">{doc.metadata.orientation}</dd>
            </div>
            <div className="catalog-doc__meta-row">
              <dt className="catalog-doc__meta-label">Pages</dt>
              <dd className="catalog-doc__meta-value">{doc.metadata.pageCount}</dd>
            </div>
            <div className="catalog-doc__meta-row">
              <dt className="catalog-doc__meta-label">Views</dt>
              <dd className="catalog-doc__meta-value">{doc.viewsCount.toLocaleString()}</dd>
            </div>
            <div className="catalog-doc__meta-row">
              <dt className="catalog-doc__meta-label">Likes</dt>
              <dd className="catalog-doc__meta-value">{doc.likesCount.toLocaleString()}</dd>
            </div>
          </dl>

          {/* Open in editor CTA (client island) */}
          <OpenInEditorCTA
            documentId={doc.documentId}
            title={doc.title}
            thumbnailUrl={thumbnailUrl}
            label={strings.open}
            intro={strings.gateIntro}
          />

          {/* Share button — client island: copies URL or uses native share sheet */}
          <ShareButton label={strings.share} className="catalog-doc__share" />
        </aside>

        {/* ── Below both columns ── */}
        <div className="catalog-doc__below">
          {doc.description && (
            <p className="catalog-doc__description">{doc.description}</p>
          )}

          <RelatedRow documents={related} lang={lang} label={strings.related} />
        </div>
      </div>

      {/* View beacon — renders null, records view on mount */}
      <ViewBeacon documentId={doc.documentId} />
    </>
  )
}
