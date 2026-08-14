import { describe, it, expect } from 'vitest'
import { LANGUAGES } from '@/lib/i18n/constants'
import { getCategoryLabel, getCategoryLabels } from './i18n'
import { CATEGORIES } from './taxonomy'

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