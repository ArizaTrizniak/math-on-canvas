import { LANGUAGES } from '@/lib/i18n/constants'
import type { DocumentMetadata } from './types'

type MaybeMetadata = DocumentMetadata | null | undefined

/** 1240 → "1,2 тыс." (ru) / "1.2K" (en). Unknown locales fall back to English. */
export function formatCompactCount(n: number, lang: string): string {
  const locale = LANGUAGES.some((l) => l.code === lang) ? lang : 'en'
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

/** Older documents may have no metadata; treat them as portrait sheets. */
export function sheetOrientation(meta: MaybeMetadata): 'portrait' | 'landscape' {
  return meta?.orientation === 'landscape' ? 'landscape' : 'portrait'
}

/** "A4 · 2 стр." from a `{count}` template, or null when the page count is unknown. */
export function formatSheet(meta: MaybeMetadata, pagesLabel: string): string | null {
  if (!meta?.pageCount) return null
  return `A4 · ${pagesLabel.replace('{count}', String(meta.pageCount))}`
}
