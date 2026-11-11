import { describe, it, expect } from 'vitest'
import { LANGUAGES } from '@/lib/i18n/constants'
import { getCatalogStrings, getCategoryLabel, getCategoryLabels } from './i18n'
import { CATEGORIES } from './taxonomy'

function keysOf(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix]
  return Object.entries(value).flatMap(([k, v]) => keysOf(v, prefix ? `${prefix}.${k}` : k)).sort()
}

describe('catalog locale files', () => {
  it('have the same keys in every locale', () => {
    const en = keysOf(getCatalogStrings('en'))
    for (const { code } of LANGUAGES) {
      expect(keysOf(getCatalogStrings(code)), code).toEqual(en)
    }
  })

  it('include the redesign strings', () => {
    const ru = getCatalogStrings('ru')
    expect(ru.emptyState.title).toBe('Ничего не нашлось')
    expect(ru.stats.pages).toContain('{count}')
    expect(ru.hubPill).toContain('{count}')
  })

  it('include the document page strings', () => {
    expect(getCatalogStrings('ru').doc.portrait).toBe('книжная')
    expect(getCatalogStrings('ru').shareCopied).toBe('Ссылка скопирована')
    expect(getCatalogStrings('de').doc.allInCategory).toContain('{category}')
    expect(getCatalogStrings('es').doc.page).toContain('{total}')
  })
})

describe('getCategoryLabel', () => {
  it('has a label for every category in every locale', () => {
    for (const { code } of LANGUAGES) {
      const labels = getCategoryLabels(code) as Record<string, string | undefined>
      for (const category of CATEGORIES) {
        expect(labels[category], `${code}/${category}`).toBeTruthy()
      }
    }
  })

  it('translates rather than echoing the English slug', () => {
    expect(getCategoryLabel('number-theory', 'ru')).toBe('Теория чисел')
    expect(getCategoryLabel('calculus', 'de')).toBe('Analysis')
    expect(getCategoryLabel('geometry', 'es')).toBe('Geometría')
  })

  it('falls back to English for an unknown locale', () => {
    expect(getCategoryLabel('geometry', 'fr')).toBe('Geometry')
  })

  it('falls back to the humanized slug for an unknown category', () => {
    expect(getCategoryLabel('linear-algebra', 'ru')).toBe('Linear Algebra')
  })
})