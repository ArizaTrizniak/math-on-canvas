import catalogEN from '@/lib/i18n/locales/en/catalog.json'
import catalogRU from '@/lib/i18n/locales/ru/catalog.json'
import catalogES from '@/lib/i18n/locales/es/catalog.json'
import catalogDE from '@/lib/i18n/locales/de/catalog.json'

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
