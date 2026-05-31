import { documentsApiBaseUrl } from './config'

/** True at most once per session per document (dedup guard). */
export function shouldRecordView(documentId: string): boolean {
  const key = `catalog:viewed:${documentId}`
  try {
    if (sessionStorage.getItem(key)) return false
    sessionStorage.setItem(key, '1')
    return true
  } catch {
    return true
  }
}

export function sendViewBeacon(documentId: string): void {
  try {
    void fetch(`${documentsApiBaseUrl()}/catalog/documents/${encodeURIComponent(documentId)}/views`, {
      method: 'POST',
      keepalive: true,
    })
  } catch { /* best effort */ }
}
