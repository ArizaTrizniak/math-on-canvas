import { describe, it, expect } from 'vitest'
import { documentLocalizedMeta, hreflangAlternates } from './metadata'
import type { CatalogDocumentMeta } from '../types'

const base: CatalogDocumentMeta = {
  documentId: 'd1', userId: 'u1', title: 'Triangle Poster', tags: [], category: 'geometry',
  language: 'en', thumbnailS3Key: null, likesCount: 0, viewsCount: 0,
  metadata: { orientation: 'portrait', pageCount: 1 }, size: 0,
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z',
  description: 'A geometry poster', titleI18n: { ru: 'Постер треугольников' },
  descriptionI18n: { ru: 'Геометрический постер' }, visibility: 'public',
}

describe('documentLocalizedMeta', () => {
  it('uses the translated title/description for a non-default locale', () => {
    const m = documentLocalizedMeta(base, 'ru')
    expect(m.title).toBe('Постер треугольников')
    expect(m.description).toBe('Геометрический постер')
  })
  it('falls back to the base title/description when no translation exists', () => {
    const m = documentLocalizedMeta(base, 'de')
    expect(m.title).toBe('Triangle Poster')
    expect(m.description).toBe('A geometry poster')
  })
})

describe('hreflangAlternates', () => {
  it('returns all 4 locales plus x-default for a path', () => {
    const alt = hreflangAlternates('/catalog/triangle-poster-d1')
    expect(alt['en']).toBe('https://math-on-canvas.com/en/catalog/triangle-poster-d1')
    expect(alt['ru']).toBe('https://math-on-canvas.com/ru/catalog/triangle-poster-d1')
    expect(alt['x-default']).toBe('https://math-on-canvas.com/en/catalog/triangle-poster-d1')
  })
})
