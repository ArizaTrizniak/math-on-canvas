import { describe, it, expect } from 'vitest'
import { breadcrumbList, creativeWork } from './jsonld'

describe('jsonld', () => {
  it('creativeWork sets isAccessibleForFree and inLanguage', () => {
    const ld = creativeWork({ name: 'T', description: 'D', image: 'https://x/i.png', inLanguage: 'en', url: 'https://x/u', dateModified: '2026-01-02T00:00:00Z' })
    expect(ld['@type']).toBe('CreativeWork')
    expect(ld.isAccessibleForFree).toBe(true)
    expect(ld.inLanguage).toBe('en')
  })
  it('breadcrumbList builds ordered items', () => {
    const ld = breadcrumbList([{ name: 'Home', url: 'https://x/en' }, { name: 'Catalog', url: 'https://x/en/catalog' }])
    expect(ld.itemListElement[0]!.position).toBe(1)
    expect(ld.itemListElement[1]!.position).toBe(2)
  })
})
