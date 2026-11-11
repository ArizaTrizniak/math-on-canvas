import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { formatRelativeDate, pickRelated, resolveBackHref, buildPageStrip } from './docPage'
import type { DocumentSummary } from './types'

const NOW = Date.parse('2026-11-10T12:00:00Z')
const rtf = (lang: string, value: number, unit: Intl.RelativeTimeFormatUnit) =>
  new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }).format(value, unit)

describe('formatRelativeDate', () => {
  it('formats days in the page language', () => {
    expect(formatRelativeDate('2026-11-07T12:00:00Z', NOW, 'ru')).toBe(rtf('ru', -3, 'day'))
    expect(formatRelativeDate('2026-11-07T12:00:00Z', NOW, 'ru')).toMatch(/3\s?дня назад/)
  })

  it('uses natural words for adjacent days', () => {
    expect(formatRelativeDate('2026-11-09T12:00:00Z', NOW, 'en')).toBe('yesterday')
  })

  it('uses minutes under an hour', () => {
    expect(formatRelativeDate('2026-11-10T11:30:00Z', NOW, 'en')).toBe('30 minutes ago')
  })

  it('uses years after twelve months', () => {
    expect(formatRelativeDate('2025-11-01T00:00:00Z', NOW, 'en')).toBe('last year')
  })

  it('returns null for an invalid or future date', () => {
    expect(formatRelativeDate('not-a-date', NOW, 'ru')).toBeNull()
    expect(formatRelativeDate('2026-12-01T00:00:00Z', NOW, 'ru')).toBeNull()
  })

  it('falls back to English for an unknown locale', () => {
    expect(formatRelativeDate('2026-11-07T12:00:00Z', NOW, 'xx')).toBe('3 days ago')
  })
})

describe('pickRelated', () => {
  const d = (id: string) => ({ documentId: id }) as DocumentSummary
  const ids = (list: DocumentSummary[]) => list.map((x) => x.documentId)

  it('puts category matches first, drops the current document and duplicates', () => {
    expect(ids(pickRelated([d('cur'), d('a'), d('b')], [d('b'), d('c')], 'cur'))).toEqual(['a', 'b', 'c'])
  })

  it('caps the result at six', () => {
    expect(pickRelated(['1', '2', '3', '4', '5', '6', '7'].map(d), [], 'x')).toHaveLength(6)
  })

  it('returns an empty list when nothing matches', () => {
    expect(pickRelated([], [], 'x')).toEqual([])
  })
})

describe('resolveBackHref', () => {
  it('keeps a stored catalog list URL of the same language', () => {
    expect(resolveBackHref('/ru/catalog?category=geometry&tags=a', 'ru')).toBe('/ru/catalog?category=geometry&tags=a')
    expect(resolveBackHref('/ru/catalog/tag/triangle', 'ru')).toBe('/ru/catalog/tag/triangle')
    expect(resolveBackHref('/ru/catalog/category/algebra', 'ru')).toBe('/ru/catalog/category/algebra')
    expect(resolveBackHref('/ru/catalog', 'ru')).toBe('/ru/catalog')
  })

  it('falls back for another language, other origins and document pages', () => {
    expect(resolveBackHref('/en/catalog?x=1', 'ru')).toBe('/ru/catalog')
    expect(resolveBackHref('//evil.com/ru/catalog', 'ru')).toBe('/ru/catalog')
    expect(resolveBackHref('https://evil.com', 'ru')).toBe('/ru/catalog')
    expect(resolveBackHref('/ru/catalog/page-1-abc', 'ru')).toBe('/ru/catalog')
    expect(resolveBackHref('/ru/catalogue', 'ru')).toBe('/ru/catalog')
    expect(resolveBackHref(null, 'ru')).toBe('/ru/catalog')
  })
})

describe('buildPageStrip', () => {
  beforeEach(() => { vi.stubEnv('NEXT_PUBLIC_DOCUMENTS_CDN_BASE_URL', 'https://cdn') })
  afterEach(() => { vi.unstubAllEnvs() })

  const pt = (index: number) => ({ index, s3Key: `p${index}`, smallS3Key: `s${index}`, width: 1600, height: 1131 })
  const meta = (pageCount: number) => ({ orientation: 'landscape' as const, pageCount })

  it('uses the document thumbnail for the first sheet when per-page thumbnails are missing', () => {
    expect(buildPageStrip({ thumbnailS3Key: 't', metadata: meta(3), pageThumbnails: null }).map((p) => p.src))
      .toEqual(['https://cdn/t', null, null])
  })

  it('maps per-page thumbnails by index and leaves gaps empty', () => {
    expect(buildPageStrip({ thumbnailS3Key: 't', metadata: meta(3), pageThumbnails: [pt(1), pt(3)] }).map((p) => p.smallSrc))
      .toEqual(['https://cdn/s1', null, 'https://cdn/s3'])
  })

  it('ignores thumbnails beyond the page count', () => {
    expect(buildPageStrip({ thumbnailS3Key: 't', metadata: meta(2), pageThumbnails: [pt(1), pt(2), pt(5)] })).toHaveLength(2)
  })

  it('returns a single empty sheet without metadata or thumbnail', () => {
    expect(buildPageStrip({ thumbnailS3Key: null, metadata: undefined as never }))
      .toEqual([{ index: 1, src: null, smallSrc: null, width: null, height: null }])
  })
})
