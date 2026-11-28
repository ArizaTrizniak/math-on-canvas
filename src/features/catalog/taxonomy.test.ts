import { describe, it, expect } from 'vitest'
import { activeCategories, activeCategoriesFromFacets, resolveDocumentCategory } from './taxonomy'

describe('resolveDocumentCategory', () => {
  it('returns the first known subject', () => {
    expect(resolveDocumentCategory({
      subjects: ['geometry'],
    })).toBe('geometry')
  })

  it('skips unknown subjects and picks the first known catalog category', () => {
    expect(resolveDocumentCategory({
      subjects: ['math', 'algebra'],
    })).toBe('algebra')
  })

  it('returns null when subjects are missing or contain only unknown values', () => {
    expect(resolveDocumentCategory({ subjects: ['math'] })).toBeNull()
    expect(resolveDocumentCategory({ subjects: [] })).toBeNull()
    expect(resolveDocumentCategory({})).toBeNull()
  })
})

describe('activeCategories', () => {
  it('collects all known categories from subjects in canonical order', () => {
    const docs = [
      { subjects: ['geometry'] },
      { subjects: ['algebra', 'math'] },
      { subjects: ['trigonometry', 'geometry'] },
    ]
    expect(activeCategories(docs)).toEqual(['algebra', 'geometry', 'trigonometry'])
  })

  it('returns empty array when no documents have known subjects', () => {
    expect(activeCategories([])).toEqual([])
    expect(activeCategories([{ subjects: ['math'] }])).toEqual([])
  })
})

describe('activeCategoriesFromFacets', () => {
  it('returns known categories with count > 0 in canonical order', () => {
    expect(activeCategoriesFromFacets({
      subjects: [
        { id: 'geometry', count: 7 },
        { id: 'calculus', count: 0 },
        { id: 'algebra', count: 2 },
        { id: 'math', count: 1 },
      ],
    })).toEqual(['algebra', 'geometry'])
  })

  it('returns empty array when facets.subjects is empty', () => {
    expect(activeCategoriesFromFacets({ subjects: [] })).toEqual([])
  })

  it('returns null when facets.subjects is absent', () => {
    expect(activeCategoriesFromFacets(null)).toBeNull()
    expect(activeCategoriesFromFacets({})).toBeNull()
  })
})
