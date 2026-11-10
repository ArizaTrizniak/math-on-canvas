import { describe, it, expect } from 'vitest'
import { formatCompactCount, sheetOrientation, formatSheet } from './format'
import { CATEGORIES, CATEGORY_GLYPHS, categoryGlyph } from './taxonomy'

describe('formatCompactCount', () => {
  it('uses the locale compact notation', () => {
    expect(formatCompactCount(1240, 'ru')).toBe(new Intl.NumberFormat('ru', { notation: 'compact', maximumFractionDigits: 1 }).format(1240))
    expect(formatCompactCount(1240, 'ru')).toMatch(/^1,2\s?тыс\.$/)
  })

  it('leaves small numbers as is', () => {
    expect(formatCompactCount(980, 'en')).toBe('980')
  })

  it('falls back to English for an unknown locale', () => {
    expect(formatCompactCount(0, 'xx')).toBe('0')
    expect(formatCompactCount(1500, 'xx')).toBe('1.5K')
  })
})

describe('sheetOrientation', () => {
  it('reads the orientation from metadata', () => {
    expect(sheetOrientation({ orientation: 'landscape', pageCount: 2 })).toBe('landscape')
  })

  it('defaults to portrait when metadata is missing', () => {
    expect(sheetOrientation(undefined)).toBe('portrait')
    expect(sheetOrientation(null)).toBe('portrait')
  })
})

describe('formatSheet', () => {
  it('renders the format and page count', () => {
    expect(formatSheet({ orientation: 'portrait', pageCount: 2 }, '{count} стр.')).toBe('A4 · 2 стр.')
  })

  it('returns null without a page count', () => {
    expect(formatSheet(null, '{count} p.')).toBeNull()
    expect(formatSheet(undefined, '{count} p.')).toBeNull()
  })
})

describe('categoryGlyph', () => {
  it('has a glyph for every category', () => {
    for (const c of CATEGORIES) expect(CATEGORY_GLYPHS[c], c).toBeTruthy()
  })

  it('returns the glyph of a known category', () => {
    expect(categoryGlyph('geometry')).toBe('△')
  })

  it('falls back for unknown or missing categories', () => {
    expect(categoryGlyph('linear-algebra')).toBe('∗')
    expect(categoryGlyph(null)).toBe('∗')
  })
})
