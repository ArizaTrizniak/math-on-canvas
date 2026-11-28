const KEY = 'catalog:openIntent'

/**
 * How long a pending "open in editor" survives in sessionStorage across an OAuth
 * redirect before CatalogIntentResume (mounted in CatalogShell) drops it as stale.
 */
export const INTENT_TTL_MS = 10 * 60 * 1000

interface StoredIntent {
  id: string
  at: number
}

export function saveIntent(documentId: string, now: number = Date.now()): void {
  const value: StoredIntent = { id: documentId, at: now }
  try { sessionStorage.setItem(KEY, JSON.stringify(value)) } catch { /* ignore */ }
}

export function readIntent(now: number = Date.now()): string | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredIntent>
    if (typeof parsed?.id !== 'string' || typeof parsed.at !== 'number') return null
    return now - parsed.at <= INTENT_TTL_MS ? parsed.id : null
  } catch {
    return null
  }
}

export function clearIntent(): void {
  try { sessionStorage.removeItem(KEY) } catch { /* ignore */ }
}

export function consumeIntent(now: number = Date.now()): string | null {
  const id = readIntent(now)
  if (!id) return null
  clearIntent()
  return id
}

export function editorDocumentHref(documentId: string): string {
  return `/editor?doc=${encodeURIComponent(documentId)}`
}
