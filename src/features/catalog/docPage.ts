import { LANGUAGES } from '@/lib/i18n/constants'
import { buildThumbnailUrl } from './thumbnail'
import type { CatalogDocumentMeta, DocumentSummary } from './types'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const MONTH = 30 * DAY
const YEAR = 365 * DAY

function localeOf(lang: string): string {
  return LANGUAGES.some((l) => l.code === lang) ? lang : 'en'
}

/** "3 дня назад" / "yesterday". Null for an invalid date or one in the future. */
export function formatRelativeDate(iso: string, now: number, lang: string): string | null {
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return null
  const diff = now - then
  if (diff < -MINUTE) return null

  const rtf = new Intl.RelativeTimeFormat(localeOf(lang), { numeric: 'auto' })
  const ago = Math.max(diff, 0)
  if (ago < HOUR) return rtf.format(-Math.round(ago / MINUTE), 'minute')
  if (ago < DAY) return rtf.format(-Math.round(ago / HOUR), 'hour')
  if (ago < MONTH) return rtf.format(-Math.round(ago / DAY), 'day')
  if (ago < YEAR) return rtf.format(-Math.round(ago / MONTH), 'month')
  return rtf.format(-Math.round(ago / YEAR), 'year')
}

/** Same-category documents first, then tag matches; without the current one and duplicates. */
export function pickRelated(
  byCategory: DocumentSummary[],
  byTag: DocumentSummary[],
  currentId: string,
  max = 6,
): DocumentSummary[] {
  const seen = new Set([currentId])
  const out: DocumentSummary[] = []
  for (const doc of [...byCategory, ...byTag]) {
    if (seen.has(doc.documentId)) continue
    seen.add(doc.documentId)
    out.push(doc)
    if (out.length === max) break
  }
  return out
}

/** sessionStorage key holding the last catalog list URL the visitor saw. */
export const LIST_URL_KEY = 'catalog:lastListUrl'

/** A stored "back to results" path, accepted only if it is a same-language catalog list. */
export function resolveBackHref(stored: string | null, lang: string): string {
  const fallback = `/${lang}/catalog`
  if (!stored || !stored.startsWith('/') || stored.startsWith('//')) return fallback
  const isList =
    stored === fallback ||
    stored.startsWith(`${fallback}?`) ||
    stored.startsWith(`${fallback}/category/`) ||
    stored.startsWith(`${fallback}/tag/`)
  return isList ? stored : fallback
}

export interface PageStripItem {
  index: number
  src: string | null
  smallSrc: string | null
  width: number | null
  height: number | null
}

/** One entry per sheet; images come from per-page thumbnails, the first sheet falls back to the document thumbnail. */
export function buildPageStrip(
  doc: Pick<CatalogDocumentMeta, 'thumbnailS3Key' | 'metadata' | 'pageThumbnails'>,
): PageStripItem[] {
  const count = Math.max(1, doc.metadata?.pageCount ?? 1)
  const byIndex = new Map((doc.pageThumbnails ?? []).map((p) => [p.index, p]))

  return Array.from({ length: count }, (_, i) => {
    const index = i + 1
    const page = byIndex.get(index)
    if (page) {
      return {
        index,
        src: buildThumbnailUrl(page.s3Key),
        smallSrc: buildThumbnailUrl(page.smallS3Key),
        width: page.width,
        height: page.height,
      }
    }
    const fallback = index === 1 ? buildThumbnailUrl(doc.thumbnailS3Key) : null
    return { index, src: fallback, smallSrc: fallback, width: null, height: null }
  })
}
