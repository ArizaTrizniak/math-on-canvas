import { describe, it, expect } from 'vitest'
import { buildSlug, isDocumentSlug, parseIdFromSlug } from './slug'

// Real document ids are UUIDs (node:crypto randomUUID) — they CONTAIN dashes,
// so the slug round-trip must recover the full UUID, not just the last segment.
const ID = '1ded5c3d-a18e-4216-963b-c284021c682c'

describe('catalog slug', () => {
  it('builds a kebab slug with the uuid tail', () => {
    expect(buildSlug('Pythagorean Theorem Poster!', ID)).toBe(`pythagorean-theorem-poster-${ID}`)
  })
  it('falls back to the bare id for empty / non-latin titles', () => {
    expect(buildSlug('   ', ID)).toBe(ID)
    expect(buildSlug('Картинки', ID)).toBe(ID)
  })
  it('parses the uuid from a title+id slug', () => {
    expect(parseIdFromSlug(`pythagorean-theorem-poster-${ID}`)).toBe(ID)
  })
  it('parses the uuid from a bare-id slug', () => {
    expect(parseIdFromSlug(ID)).toBe(ID)
  })
  it('round-trips any title back to the id', () => {
    for (const title of ['Pythagorean Theorem Poster!', 'Картинки', '   ', 'a/b c']) {
      expect(parseIdFromSlug(buildSlug(title, ID))).toBe(ID)
    }
  })
  it('isDocumentSlug is true for a title+uuid slug and a bare uuid', () => {
    expect(isDocumentSlug(`right-triangles-${ID}`)).toBe(true)
    expect(isDocumentSlug(ID)).toBe(true)
  })
  it('isDocumentSlug is false for hub slugs and slugs without a uuid', () => {
    expect(isDocumentSlug('geometry')).toBe(false)
    expect(isDocumentSlug('right-triangles-1234')).toBe(false)
    expect(isDocumentSlug(`${ID}-extra`)).toBe(false)
  })
})
