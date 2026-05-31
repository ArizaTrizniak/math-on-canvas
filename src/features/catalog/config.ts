/** Base URL of the documents service (server-side only; no trailing slash). */
export function documentsApiBaseUrl(): string {
  const url = process.env.DOCUMENTS_API_URL
  if (!url) throw new Error('DOCUMENTS_API_URL is not configured')
  return url.replace(/\/+$/, '')
}
