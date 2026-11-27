import { describe, it, expect } from 'vitest'
import { activeCategories, resolveDocumentCategory } from './taxonomy'

describe('resolveDocumentCategory', () => {
  it('prefers the first known subject over official-template category', () => {
    expect(resolveDocumentCategory({
      category: 'official-template',
      subjects: ['geometry'],
    })).toBe('geometry')
  })

  it('skips unknown subjects and picks the first known catalog category', () => {
    expect(resolveDocumentCategory({
      category: 'official-template',
      subjects: ['math', 'algebra'],
    })).toBe('algebra')
  })

  it('falls back to a legacy known category when subjects are absent', () => {
    expect(resolveDocumentCategory({
      category: 'calculus',
    })).toBe('calculus')
  })

  it('returns null when neither subjects nor category match a known category', () => {
    expect(resolveDocumentCategory({
      category: 'official-template',
      subjects: ['math'],
    })).toBeNull()
    expect(resolveDocumentCategory({ category: null })).toBeNull()
  })
})

describe('activeCategories', () => {
  it('collects all known categories from subjects and legacy categories in canonical order', () => {
    const docs = [
      { category: 'official-template', subjects: ['geometry'] },
      { category: 'official-template', subjects: ['algebra', 'math'] },
      { category: 'official-template', subjects: ['trigonometry', 'geometry'] },
      { category: 'statistics', subjects: [] },
    ]
    expect(activeCategories(docs)).toEqual(['algebra', 'geometry', 'statistics', 'trigonometry'])
  })

  it('returns empty array when no documents have known categories', () => {
    expect(activeCategories([])).toEqual([])
    expect(activeCategories([{ category: 'official-template', subjects: ['math'] }])).toEqual([])
  })
})
