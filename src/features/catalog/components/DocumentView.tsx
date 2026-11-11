import Link from 'next/link'
import { LANGUAGES } from '@/lib/i18n/constants'
import type { CatalogDocumentMeta, DocumentSummary } from '../types'
import { buildThumbnailUrl } from '../thumbnail'
import { getCatalogStrings, getCategoryLabel } from '../i18n'
import { categoryGlyph } from '../taxonomy'
import { formatCompactCount, sheetOrientation } from '../format'
import { buildPageStrip, formatRelativeDate } from '../docPage'
import { documentLocalizedMeta } from '../seo/metadata'
import { OpenInEditorCTA } from './OpenInEditorCTA'
import { ViewBeacon } from './ViewBeacon'
import { RelatedRow } from './RelatedRow'
import { ShareButton } from './ShareButton'
import { DocumentPreview } from './DocumentPreview'
import { ExpandableText } from './ExpandableText'
import { GuestOnly } from './GuestOnly'
import './DocumentView.css'

interface Props {
  doc: CatalogDocumentMeta
  lang: string
  related: DocumentSummary[]
}

export function DocumentView({ doc, lang, related }: Props) {
  const strings = getCatalogStrings(lang)
  const s = strings.doc
  const { title, description } = documentLocalizedMeta(doc, lang)
  // documentLocalizedMeta falls back to the title when there is no description.
  const hasDescription = Boolean(description) && description !== title
  const thumbnailUrl = buildThumbnailUrl(doc.thumbnailS3Key)
  const orientation = sheetOrientation(doc.metadata)
  // Server component: rendered once per ISR revalidation (300 s) and never re-rendered on the client.
  // eslint-disable-next-line react-hooks/purity -- see above; staleness of a few minutes is acceptable
  const updated = formatRelativeDate(doc.updatedAt, Date.now(), lang)
  const categoryLabel = doc.category ? getCategoryLabel(doc.category, lang) : null
  const languageLabel = LANGUAGES.find((l) => l.code === doc.language)?.label ?? doc.language
  const tags = doc.tags ?? []

  return (
    <article className="catalog-doc">
      <header className="catalog-doc__head">
        <div className="catalog-doc__kicker">
          {doc.category && categoryLabel && (
            <Link href={`/${lang}/catalog/category/${doc.category}`} className="catalog-doc__category">
              <span className="catalog-doc__glyph" aria-hidden="true">{categoryGlyph(doc.category)}</span>
              {categoryLabel}
            </Link>
          )}
          {updated && <span className="catalog-doc__updated">{s.updated.replace('{date}', updated)}</span>}
        </div>
        <h1 className="catalog-doc__title">{title}</h1>
        {hasDescription && (
          <ExpandableText
            text={description}
            expandLabel={s.expand}
            collapseLabel={s.collapse}
            className="catalog-doc__description"
          />
        )}
      </header>

      <div className="catalog-doc__body">
        <div className="catalog-doc__main">
          <DocumentPreview
            pages={buildPageStrip(doc)}
            alt={title}
            orientation={orientation}
            category={doc.category}
            labels={{
              region: s.previewLabel,
              fullscreen: s.fullscreen,
              close: s.closeFullscreen,
              strip: s.strip,
              page: s.page,
              prev: s.prev,
              next: s.next,
            }}
          />
        </div>

        <aside className="catalog-doc__rail">
          <div className="catalog-doc__actions">
            <OpenInEditorCTA
              className="catalog-doc__cta"
              documentId={doc.documentId}
              title={title}
              thumbnailUrl={thumbnailUrl}
              label={strings.open}
              intro={strings.gateIntro}
            />
            <ShareButton label={strings.share} copiedLabel={strings.shareCopied} className="catalog-doc__share" />
          </div>
          <GuestOnly>
            <p className="catalog-doc__free">{s.freeNote}</p>
          </GuestOnly>

          <dl className="catalog-doc__facts">
            <div>
              <dt>{s.format}</dt>
              <dd>{orientation === 'portrait' ? `A4 ▯ ${s.portrait}` : `A4 ▭ ${s.landscape}`}</dd>
            </div>
            {doc.metadata?.pageCount ? (
              <div>
                <dt>{s.pages}</dt>
                <dd>{doc.metadata.pageCount}</dd>
              </div>
            ) : null}
            <div>
              <dt>{s.views}</dt>
              <dd>{formatCompactCount(doc.viewsCount, lang)}</dd>
            </div>
            <div>
              <dt>{s.language}</dt>
              <dd>{languageLabel}</dd>
            </div>
          </dl>

          {tags.length > 0 && (
            <div className="catalog-doc__tags">
              <span className="catalog-doc__label">{s.tags}</span>
              <ul>
                {tags.map((tag) => (
                  <li key={tag}>
                    <Link href={`/${lang}/catalog/tag/${encodeURIComponent(tag)}`}>#{tag}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <section className="catalog-doc__howto" aria-labelledby="catalog-doc-howto">
            <h2 id="catalog-doc-howto">{s.howTo.title}</h2>
            <ol>
              <li>{s.howTo.step1}</li>
              <li>{s.howTo.step2}</li>
              <li>{s.howTo.step3}</li>
            </ol>
          </section>
        </aside>
      </div>

      <RelatedRow
        documents={related}
        lang={lang}
        label={s.relatedTitle}
        moreHref={doc.category ? `/${lang}/catalog/category/${doc.category}` : undefined}
        moreLabel={categoryLabel ? s.allInCategory.replace('{category}', categoryLabel) : undefined}
      />

      <ViewBeacon documentId={doc.documentId} />
    </article>
  )
}
