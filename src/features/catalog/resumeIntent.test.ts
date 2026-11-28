import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { saveIntent, readIntent } from './intent'
import { resolveCatalogIntentAction } from './resumeIntent'

beforeEach(() => {
  const store = new Map<string, string>()
  vi.stubGlobal('sessionStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  })
})
afterEach(() => vi.unstubAllGlobals())

describe('resolveCatalogIntentAction', () => {
  it('waits (noop) while auth status is loading and keeps the stored intent', () => {
    saveIntent('doc-1')

    expect(
      resolveCatalogIntentAction({ status: 'loading', modalOpen: false }),
    ).toEqual({ kind: 'noop' })
    expect(readIntent()).toBe('doc-1')
  })

  it('waits (noop) while auth modal is still open (e.g. ResetDoneView or OAuth error retry)', () => {
    saveIntent('doc-1')

    expect(
      resolveCatalogIntentAction({ status: 'authenticated', modalOpen: true }),
    ).toEqual({ kind: 'noop' })
    expect(
      resolveCatalogIntentAction({ status: 'guest', modalOpen: true }),
    ).toEqual({ kind: 'noop' })
    expect(readIntent()).toBe('doc-1')
  })

  it('clears stale intent when visitor is guest with no modal open (e.g. browser Back, reload, or dismiss)', () => {
    saveIntent('doc-1')

    expect(
      resolveCatalogIntentAction({ status: 'guest', modalOpen: false }),
    ).toEqual({ kind: 'cleared' })
    expect(readIntent()).toBeNull()
  })

  it('redirects once when authenticated and modal is closed', () => {
    saveIntent('doc/1')

    expect(
      resolveCatalogIntentAction({ status: 'authenticated', modalOpen: false }),
    ).toEqual({ kind: 'redirect', href: '/editor?doc=doc%2F1' })

    expect(readIntent()).toBeNull()
    expect(
      resolveCatalogIntentAction({ status: 'authenticated', modalOpen: false }),
    ).toEqual({ kind: 'noop' })
  })

  it('returns noop when authenticated without stored intent', () => {
    expect(
      resolveCatalogIntentAction({ status: 'authenticated', modalOpen: false }),
    ).toEqual({ kind: 'noop' })
  })
})
