import Image from 'next/image'
import Link from 'next/link'
import { TIERS } from '@/lib/pricing/tiers'
import { PricingCard } from './PricingCard'
import type { LanguageCode } from '@/lib/i18n/constants'
import pricingEN from '@/lib/i18n/locales/en/pricing.json'
import pricingRU from '@/lib/i18n/locales/ru/pricing.json'
import pricingES from '@/lib/i18n/locales/es/pricing.json'
import pricingDE from '@/lib/i18n/locales/de/pricing.json'
import './PricingPage.css'

const logo = '/images/logo.svg'

const translations = {
    en: pricingEN,
    ru: pricingRU,
    es: pricingES,
    de: pricingDE,
} as const

interface PricingPageProps {
    lang: LanguageCode
}

export function PricingPage({ lang }: PricingPageProps) {
    const t = translations[lang]

    return (
        <div className="pricing">
            <div className="pricing__texture" aria-hidden="true">
                <span className="pricing__grid" />
            </div>

            <header className="pricing__header">
                <Link href={`/${lang}`} className="pricing__brand">
                    <Image
                        className="pricing__brand-logo"
                        src={logo}
                        alt="Math on Canvas"
                        width={44}
                        height={44}
                        unoptimized
                    />
                    <span className="pricing__brand-title">Math on Canvas</span>
                </Link>
            </header>

            <main className="pricing__main">
                <div className="pricing__hero">
                    <h1 className="pricing__headline">{t.headline}</h1>
                    <p className="pricing__subline">{t.subline}</p>
                </div>

                <div className="pricing__cards">
                    {TIERS.map((tier) => (
                        <PricingCard key={tier.id} tier={tier} t={t} lang={lang} />
                    ))}
                </div>
            </main>

            <footer className="pricing__footer">
                {t.footer}
            </footer>
        </div>
    )
}
