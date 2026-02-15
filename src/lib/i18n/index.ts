import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translations
import commonEN from './locales/en/common.json'
import commonRU from './locales/ru/common.json'
import commonES from './locales/es/common.json'
import commonDE from './locales/de/common.json'

export const resources = {
    en: {
        common: commonEN
    },
    ru: {
        common: commonRU
    },
    es: {
        common: commonES
    },
    de: {
        common: commonDE
    }
} as const

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        defaultNS: 'common',
        ns: ['common'],
        interpolation: {
            escapeValue: false
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'i18nextLng'
        },
       // debug: import.meta.env.DEV
    })

export default i18n
