import catalogEN from '@/lib/i18n/locales/en/catalog.json'
import catalogRU from '@/lib/i18n/locales/ru/catalog.json'
import catalogES from '@/lib/i18n/locales/es/catalog.json'
import catalogDE from '@/lib/i18n/locales/de/catalog.json'
import { humanizeSlug } from './taxonomy'

export type CatalogStrings = typeof catalogEN

const catalogTranslations: Record<string, CatalogStrings> = {
  en: catalogEN,
  ru: catalogRU,
  es: catalogES,
  de: catalogDE,
}

/** Catalog strings for a locale, falling back to English for unknown languages. */
export function getCatalogStrings(lang: string): CatalogStrings {
  return catalogTranslations[lang] ?? catalogTranslations.en
}

type CategoryLabels = CatalogStrings['categories']

/**
 * Display name of a category in the given locale.
 * Falls back to the humanized slug for anything not in the taxonomy, so an
 * unknown category slug still renders as readable text instead of blank.
 */
export function getCategoryLabel(category: string, lang: string): string {
  const labels = getCatalogStrings(lang).categories as Record<string, string | undefined>
  return labels[category] ?? humanizeSlug(category)
}

/** Every category label for a locale, keyed by slug. */
export function getCategoryLabels(lang: string): CategoryLabels {
  return getCatalogStrings(lang).categories
}
