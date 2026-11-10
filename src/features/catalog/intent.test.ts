import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { saveIntent, readIntent, clearIntent, INTENT_TTL_MS } from './intent'

beforeEach(() => {
  const store = new Map<string, string>()
  vi.stubGlobal('sessionStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  })
})
afterEach(() => vi.unstubAllGlobals())

describe('catalog intent', () => {
  it('round-trips a documentId', () => {
    saveIntent('doc-1')
    expect(readIntent()).toBe('doc-1')
  })
  it('clears the intent', () => {
    saveIntent('doc-1'); clearIntent()
    expect(readIntent()).toBeNull()
  })
})

describe('catalog intent expiry', () => {
  it('ignores an intent older than the TTL', () => {
    saveIntent('doc-1', 1_000)
    expect(readIntent(1_000 + INTENT_TTL_MS + 1)).toBeNull()
  })

  it('keeps a fresh intent', () => {
    saveIntent('doc-1', 1_000)
    expect(readIntent(1_000 + INTENT_TTL_MS - 1)).toBe('doc-1')
  })

  it('ignores a legacy plain-string intent', () => {
    sessionStorage.setItem('catalog:openIntent', 'doc-1')
    expect(readIntent()).toBeNull()
  })
})
