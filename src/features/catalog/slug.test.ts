import { describe, it, expect } from 'vitest'
import { buildSlug, parseIdFromSlug } from './slug'

describe('catalog slug', () => {
  it('builds a kebab slug with the id tail', () => {
    expect(buildSlug('Pythagorean Theorem Poster!', 'a1b2c3')).toBe('pythagorean-theorem-poster-a1b2c3')
  })
  it('handles empty/non-ascii titles by falling back to the id', () => {
    expect(buildSlug('   ', 'a1b2c3')).toBe('a1b2c3')
  })
  it('parses the id from the slug tail', () => {
    expect(parseIdFromSlug('pythagorean-theorem-poster-a1b2c3')).toBe('a1b2c3')
  })
  it('parses the id when the slug is just the id', () => {
    expect(parseIdFromSlug('a1b2c3')).toBe('a1b2c3')
  })
})
