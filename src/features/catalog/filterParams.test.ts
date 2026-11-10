import { describe, it, expect } from 'vitest'
import { parseTags, buildCatalogHref, clearFiltersHref, hasActiveFilters, readFilterState } from './filterParams'

describe('parseTags', () => {
  it('trims, lower-cases, drops empties and duplicates', () => {
    expect(parseTags(' Triangle, ,triangle,area,')).toEqual(['triangle', 'area'])
  })

  it('accepts repeated query values', () => {
    expect(parseTags(['a,b', 'b'])).toEqual(['a', 'b'])
  })

  it('returns an empty list for a missing value', () => {
    expect(parseTags(undefined)).toEqual([])
    expect(parseTags(null)).toEqual([])
  })
})

describe('buildCatalogHref', () => {
  const sp = () => new URLSearchParams('category=algebra&cursor=abc&utm_source=x')

  it('replaces a filter, drops the cursor and keeps unrelated params', () => {
    expect(buildCatalogHref('/ru/catalog', sp(), { category: 'geometry' }))
      .toBe('/ru/catalog?category=geometry&utm_source=x')
  })

  it('removes a filter set to null', () => {
    expect(buildCatalogHref('/ru/catalog', sp(), { category: null }))
      .toBe('/ru/catalog?utm_source=x')
  })

  it('removes a filter set to an empty string', () => {
    expect(buildCatalogHref('/ru/catalog', sp(), { category: '' }))
      .toBe('/ru/catalog?utm_source=x')
  })

  it('sets the cursor when only the cursor is patched', () => {
    expect(buildCatalogHref('/ru/catalog', new URLSearchParams(), { cursor: 'n1' }))
      .toBe('/ru/catalog?cursor=n1')
  })

  it('does not mutate the passed params', () => {
    const params = sp()
    buildCatalogHref('/ru/catalog', params, { category: 'geometry' })
    expect(params.get('cursor')).toBe('abc')
  })
})

describe('clearFiltersHref', () => {
  it('drops every filter and the cursor, keeps the rest', () => {
    expect(clearFiltersHref('/ru/catalog', new URLSearchParams('tags=a&sort=likesCount&cursor=c&utm_source=x')))
      .toBe('/ru/catalog?utm_source=x')
  })

  it('returns the bare pathname when nothing is left', () => {
    expect(clearFiltersHref('/ru/catalog', new URLSearchParams('language=ru'))).toBe('/ru/catalog')
  })
})

describe('hasActiveFilters', () => {
  it('does not count sorting as a filter', () => {
    expect(hasActiveFilters(new URLSearchParams('sort=likesCount'))).toBe(false)
  })

  it('counts category, tags and language', () => {
    expect(hasActiveFilters(new URLSearchParams('tags=a'))).toBe(true)
    expect(hasActiveFilters(new URLSearchParams('category=algebra'))).toBe(true)
    expect(hasActiveFilters(new URLSearchParams('language=ru'))).toBe(true)
  })

  it('ignores empty values', () => {
    expect(hasActiveFilters(new URLSearchParams('tags=&category='))).toBe(false)
  })
})

describe('readFilterState', () => {
  it('reads every repeated tags value, like the server does', () => {
    expect(readFilterState(new URLSearchParams('tags=a&tags=b')).tags).toEqual(['a', 'b'])
  })

  it('defaults sort to updatedAt and empty filters to empty strings', () => {
    expect(readFilterState(new URLSearchParams())).toEqual({ category: '', language: '', sort: 'updatedAt', tags: [] })
  })
})
