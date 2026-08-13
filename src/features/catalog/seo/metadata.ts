import { BASE_URL } from '@/lib/site'
import { LANGUAGES } from '@/lib/i18n/constants'
import type { CatalogDocumentMeta } from '../types'

/** Resolve the localized title/description for a document, falling back to the base fields. */
export function documentLocalizedMeta(doc: CatalogDocumentMeta, lang: string): { title: string; description: string } {
  return {
    title: doc.titleI18n?.[lang] ?? doc.title,
    description: doc.descriptionI18n?.[lang] ?? doc.description ?? doc.title,
  }
}

/** hreflang map for a locale-less path (e.g. '/catalog/...'), including x-default → en. */
export function hreflangAlternates(path: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const { code } of LANGUAGES) out[code] = `${BASE_URL}/${code}${path}`
  out['x-default'] = `${BASE_URL}/en${path}`
  return out
}
