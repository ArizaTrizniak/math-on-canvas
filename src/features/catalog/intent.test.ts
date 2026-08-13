import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { saveIntent, readIntent, clearIntent } from './intent'

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
