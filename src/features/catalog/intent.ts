const KEY = 'catalog:openIntent'

export function saveIntent(documentId: string): void {
  try { sessionStorage.setItem(KEY, documentId) } catch { /* ignore */ }
}
export function readIntent(): string | null {
  try { return sessionStorage.getItem(KEY) } catch { return null }
}
export function clearIntent(): void {
  try { sessionStorage.removeItem(KEY) } catch { /* ignore */ }
}
