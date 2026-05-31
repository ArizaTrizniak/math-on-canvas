import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translations
import commonEN from './locales/en/common.json'
import commonRU from './locales/ru/common.json'
import commonES from './locales/es/common.json'
import commonDE from './locales/de/common.json'
import landingEN from './locales/en/landing.json'
import landingRU from './locales/ru/landing.json'
import landingES from './locales/es/landing.json'
import landingDE from './locales/de/landing.json'
import authEN from './locales/en/auth.json'
import authRU from './locales/ru/auth.json'
import authES from './locales/es/auth.json'
import authDE from './locales/de/auth.json'
import catalogEN from './locales/en/catalog.json'
import catalogRU from './locales/ru/catalog.json'
import catalogES from './locales/es/catalog.json'
import catalogDE from './locales/de/catalog.json'

export const resources = {
    en: {
        common: commonEN,
        landing: landingEN,
        auth: authEN,
        catalog: catalogEN,
    },
    ru: {
        common: commonRU,
        landing: landingRU,
        auth: authRU,
        catalog: catalogRU,
    },
    es: {
        common: commonES,
        landing: landingES,
        auth: authES,
        catalog: catalogES,
    },
    de: {
        common: commonDE,
        landing: landingDE,
        auth: authDE,
        catalog: catalogDE,
    }
} as const

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        defaultNS: 'common',
        ns: ['common', 'landing', 'auth', 'catalog'],
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
