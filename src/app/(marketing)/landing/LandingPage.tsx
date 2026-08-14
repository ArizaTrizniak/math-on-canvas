import Image from 'next/image'
import Link from 'next/link'
import type { AuthUser } from '@/lib/auth/types'
import { isAdmin } from '@/lib/auth/roles'
import type { LanguageCode } from '@/lib/i18n/constants'
import landingEN from '@/lib/i18n/locales/en/landing.json'
import landingRU from '@/lib/i18n/locales/ru/landing.json'
import landingES from '@/lib/i18n/locales/es/landing.json'
import landingDE from '@/lib/i18n/locales/de/landing.json'
import commonEN from '@/lib/i18n/locales/en/common.json'
import commonRU from '@/lib/i18n/locales/ru/common.json'
import commonES from '@/lib/i18n/locales/es/common.json'
import commonDE from '@/lib/i18n/locales/de/common.json'
import { getCatalogStrings, getCategoryLabel } from '@/features/catalog/i18n'
import { CATEGORIES } from '@/features/catalog/taxonomy'
import LanguageSwitch from './widgets/LanguageSwitch/LandingLanguageSwitch'
import { LandingCarousel } from './widgets/LandingCarousel/LandingCarousel'
import { LandingSignIn } from './widgets/LandingSignIn/LandingSignIn'
import { LandingCTALink } from './widgets/LandingCTALink/LandingCTALink'
import UserMenu from '@/common/widgets/UserMenu/UserMenu'
import {
    featureKeys,
    highlightKeys,
    stepKeys,
    audienceKeys,
    comingKeys,
    faqKeys,
    screenshotKeys,
    outputHighlightKeys,
} from '@/features/landing/keys'
import './LandingPage.css'

const logo = '/images/logo.svg'
const docsUrl = process.env.DOCS_URL ?? 'https://docs.math-on-canvas.com/'

const translations = {
    en: landingEN,
    ru: landingRU,
    es: landingES,
    de: landingDE,
} as const

const commonTranslations = {
    en: commonEN,
    ru: commonRU,
    es: commonES,
    de: commonDE,
} as const

const TOP_CATEGORIES = CATEGORIES.slice(0, 6)

interface LandingPageProps {
    lang: LanguageCode
    user?: AuthUser | null
    displayName?: string | null
}

export function LandingPage({ lang, user, displayName }: LandingPageProps) {
    const t = translations[lang]
    const tCommon = commonTranslations[lang]
    const tCatalog = getCatalogStrings(lang)
    const carouselImages = screenshotKeys.map((key, index) => ({
        src: `/images/screen${index + 1}.webp`,
        alt: t.preview.shots[key],
    }))
    const docsLink = (
        <a href={docsUrl} className="landing__doc" target="_blank" rel="noopener noreferrer">
            {t.cta.docs}
        </a>
    )

    return (
        <div className="landing">
            <div className="landing__texture" aria-hidden="true">
                <span className="landing__grid" />
            </div>
            <header className="landing__header">
                <div className="landing__brand">
                    <Image className="landing__brand-logo" src={logo} alt={t.brand} width={44} height={44} unoptimized />
                    <div>
                        <div className="landing__brand-title">
                            {t.brand}
                            <span className="landing__beta-badge">BETA</span>
                        </div>
                        <div className="landing__brand-subtitle">{tCommon.brandSubtitle}</div>
                    </div>
                </div>

                <div className="landing__actions">
                    <LanguageSwitch currentLang={lang} />
                    {isAdmin(user) && (
                        <Link href={`/${lang}/catalog`} className="landing__ghost">
                            {tCatalog.nav}
                        </Link>
                    )}
                    <Link href={`/${lang}/pricing`} className="landing__ghost">
                        {t.cta.pricing}
                    </Link>
                    {user && displayName ? (
                        <UserMenu displayName={displayName} signOutLabel={t.cta.signOut} />
                    ) : (
                        <LandingSignIn label={t.cta.signIn} />
                    )}
                    {docsLink}
                    <LandingCTALink href="/editor" className="landing__cta" location="header">
                        {t.cta.ready}
                    </LandingCTALink>
                </div>
            </header>

            <main className="landing__main">
                <section className="landing__hero">
                    <div className="landing__copy">
                        <div className="landing__pill">{t.hero.tag}</div>
                        <h1 className="landing__title">{t.hero.title}</h1>
                        <p className="landing__subtitle">{t.hero.subtitle}</p>
                        <p className="landing__narrative">{t.hero.narrative}</p>

                        <div className="landing__controls">
                            <LandingCTALink
                                href="/editor"
                                className="landing__cta"
                                testId="landing-start"
                                location="hero"
                            >
                                {t.cta.ready}
                            </LandingCTALink>
                            {docsLink}
                        </div>

                        <div className="landing__features">
                            <div className="landing__features-title">{t.featuresTitle}</div>
                            <ul>
                                {featureKeys.map((key) => (
                                    <li key={key}>{t.features[key]}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="landing__preview">
                        <div className="landing__preview-header">
                            <div className="landing__preview-pips">
                                <span className="landing__pip landing__pip--red" />
                                <span className="landing__pip landing__pip--yellow" />
                                <span className="landing__pip landing__pip--green" />
                            </div>
                        </div>

                        <div className="landing__preview-body">
                            <LandingCarousel
                                images={carouselImages}
                                captionText={t.preview.caption}
                            />
                        </div>
                    </div>
                </section>

                {isAdmin(user) && (
                    <section className="landing__catalog">
                        <div className="landing__catalog-copy">
                            <h2>{t.catalogTeaser.title}</h2>
                            <p>{t.catalogTeaser.description}</p>
                            <Link href={`/${lang}/catalog`} className="landing__catalog-cta">
                                {t.catalogTeaser.cta}
                            </Link>
                        </div>
                        <div className="landing__catalog-categories">
                            <div className="landing__catalog-categories-title">
                                {t.catalogTeaser.categoriesLabel}
                            </div>
                            <ul>
                                {TOP_CATEGORIES.map((category) => (
                                    <li key={category}>
                                        <Link href={`/${lang}/catalog/category/${category}`}>
                                            {getCategoryLabel(category, lang)}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>
                )}

                <section className="landing__highlights">
                    <div className="landing__highlights-header">
                        <h2>{t.highlightsTitle}</h2>
                        <p>{t.highlightsSubtitle}</p>
                    </div>
                    <div className="landing__highlights-grid">
                        {highlightKeys.map((key) => (
                            <article
                                className={`landing__highlight-card${
                                    outputHighlightKeys.has(key) ? ' landing__highlight-card--output' : ''
                                }`}
                                key={key}
                            >
                                <div className="landing__highlight-body">
                                    <h3>{t.highlights[key].title}</h3>
                                    <p>{t.highlights[key].description}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="landing__steps">
                    <div className="landing__section-header">
                        <h2>{t.steps.title}</h2>
                        <p>{t.steps.subtitle}</p>
                    </div>
                    <ol className="landing__steps-grid">
                        {stepKeys.map((key, index) => (
                            <li className="landing__step-card" key={key}>
                                <span className="landing__step-vertex" aria-hidden="true">
                                    {index + 1}
                                </span>
                                <h3>{t.steps.items[key].title}</h3>
                                <p>{t.steps.items[key].description}</p>
                            </li>
                        ))}
                    </ol>
                </section>

                <section className="landing__audience">
                    <div className="landing__section-header">
                        <h2>{t.audience.title}</h2>
                        <p>{t.audience.subtitle}</p>
                    </div>
                    <div className="landing__audience-grid">
                        {audienceKeys.map((key) => (
                            <article className="landing__audience-card" key={key}>
                                <h3>{t.audience.items[key].title}</h3>
                                <p>{t.audience.items[key].description}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="landing__coming">
                    <div className="landing__section-header">
                        <h2>{t.coming.title}</h2>
                        <p>{t.coming.description}</p>
                    </div>
                    <div className="landing__coming-card">
                        <ul className="landing__coming-list">
                            {comingKeys.map((key) => (
                                <li key={key}>{t.coming.items[key]}</li>
                            ))}
                        </ul>
                        <Link href={`/${lang}/pricing`} className="landing__coming-cta">
                            {t.coming.cta}
                        </Link>
                    </div>
                </section>

                <section className="landing__faq">
                    <div className="landing__section-header">
                        <h2>{t.faq.title}</h2>
                    </div>
                    <div className="landing__faq-grid">
                        {faqKeys.map((key) => (
                            <article className="landing__faq-item" key={key}>
                                <h3>{t.faq.items[key].q}</h3>
                                <p>{t.faq.items[key].a}</p>
                            </article>
                        ))}
                    </div>
                </section>
            </main>

            <footer className="landing__footer">
                {t.footer}
                <span aria-hidden="true" style={{ margin: '0 0.75em' }}>·</span>
                <Link href={`/${lang}/pricing`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {t.cta.pricing}
                </Link>
                <span aria-hidden="true" style={{ margin: '0 0.75em' }}>·</span>
                <Link href={`/${lang}/catalog`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {tCatalog.nav}
                </Link>
                {TOP_CATEGORIES.map((c) => (
                    <span key={c}>
                        <span aria-hidden="true" style={{ margin: '0 0.75em' }}>·</span>
                        <Link href={`/${lang}/catalog/category/${c}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            {getCategoryLabel(c, lang)}
                        </Link>
                    </span>
                ))}
                <span className="landing__version" style={{ opacity: 0.5, marginLeft: '1em' }}>
                    v{process.env.NEXT_PUBLIC_APP_VERSION}
                </span>
            </footer>
        </div>
    )
}

export default LandingPage