import Image from 'next/image'
import Link from 'next/link'
import type { AuthUser } from '@/lib/auth/types'
import type { LanguageCode } from '@/lib/i18n/constants'
import landingEN from '@/lib/i18n/locales/en/landing.json'
import landingRU from '@/lib/i18n/locales/ru/landing.json'
import landingES from '@/lib/i18n/locales/es/landing.json'
import landingDE from '@/lib/i18n/locales/de/landing.json'
import commonEN from '@/lib/i18n/locales/en/common.json'
import commonRU from '@/lib/i18n/locales/ru/common.json'
import commonES from '@/lib/i18n/locales/es/common.json'
import commonDE from '@/lib/i18n/locales/de/common.json'
import LanguageSwitch from './widgets/LanguageSwitch/LandingLanguageSwitch'
import { LandingCarousel } from './widgets/LandingCarousel/LandingCarousel'
import { LandingSignIn } from './widgets/LandingSignIn/LandingSignIn'
import { LandingCTALink } from './widgets/LandingCTALink/LandingCTALink'
import UserMenu from '@/common/widgets/UserMenu/UserMenu'
import './LandingPage.css'

const logo = '/images/logo.svg'
const carouselImages = [
    '/images/screen1.webp',
    '/images/screen2.webp',
    '/images/screen3.webp',
    '/images/screen4.webp',
]

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

const featureKeys = ['easy', 'formulas', 'shapes', 'export', 'customize'] as const
const highlightKeys = ['pdf', 'pages', 'symbols', 'visual', 'library', 'geometry'] as const

interface LandingPageProps {
    lang: LanguageCode
    user?: AuthUser | null
    displayName?: string | null
}

export function LandingPage({ lang, user, displayName }: LandingPageProps) {
    const t = translations[lang]
    const tCommon = commonTranslations[lang]

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
                    <Link href={`/${lang}/pricing`} className="landing__ghost">
                        {t.cta.pricing}
                    </Link>
                    {user && displayName ? (
                        <UserMenu displayName={displayName} signOutLabel={t.cta.signOut} />
                    ) : (
                        <LandingSignIn label={t.cta.signIn} />
                    )}
                    <Link href="/docs" className="landing__doc">
                        {t.cta.docs}
                    </Link>
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
                            <Link href="/docs" className="landing__doc">
                                {t.cta.docs}
                            </Link>
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

                <section className="landing__highlights">
                    <div className="landing__highlights-header">
                        <h2>{t.highlightsTitle}</h2>
                        <p>{t.highlightsSubtitle}</p>
                    </div>
                    <div className="landing__highlights-grid">
                        {highlightKeys.map((key) => (
                            <article className="landing__highlight-card" key={key}>
                                <div className="landing__highlight-body">
                                    <h3>{t.highlights[key].title}</h3>
                                    <p>{t.highlights[key].description}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            </main>

            <footer className="landing__footer">
                {t.footer}
                <span style={{ margin: '0 0.75em' }}>·</span>
                <Link href={`/${lang}/pricing`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {t.cta.pricing}
                </Link>
                <span className="landing__version" style={{ opacity: 0.5, marginLeft: '1em' }}>
                    v{process.env.NEXT_PUBLIC_APP_VERSION}
                </span>
            </footer>
        </div>
    )
}

export default LandingPage