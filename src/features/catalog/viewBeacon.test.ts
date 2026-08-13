import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { shouldRecordView } from './viewBeacon'

beforeEach(() => {
  const store = new Map<string, string>()
  vi.stubGlobal('sessionStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  })
})
afterEach(() => vi.unstubAllGlobals())

describe('shouldRecordView', () => {
  it('returns true the first time and false afterwards for the same document', () => {
    expect(shouldRecordView('doc-1')).toBe(true)
    expect(shouldRecordView('doc-1')).toBe(false)
  })
  it('tracks documents independently', () => {
    expect(shouldRecordView('doc-1')).toBe(true)
    expect(shouldRecordView('doc-2')).toBe(true)
  })
})
