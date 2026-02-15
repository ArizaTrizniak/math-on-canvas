/**
 * Supported languages configuration
 */
export const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'de', label: 'Deutsch' },
    { code: 'ru', label: 'Русский' }
] as const

export type LanguageCode = typeof LANGUAGES[number]['code']

/**
 * Normalize browser language code to supported language
 */
export function normalizeLanguage(lang: string): LanguageCode {
    const found = LANGUAGES.find(l => lang.startsWith(l.code))
    return found ? found.code : 'en'
}
