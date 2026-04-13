'use client'

import Link from 'next/link'
import type { Tier } from '@/lib/pricing/tiers'

interface TierTranslation {
    name: string
    price: string
    priceNote: string
    cta: string
}

interface PricingTranslations {
    tiers: { [id: string]: TierTranslation }
    features: { [key: string]: string }
}

interface PricingCardProps {
    tier: Tier
    t: PricingTranslations
    lang: string
}

export function PricingCard({ tier, t, lang }: PricingCardProps) {
    const tt = t.tiers[tier.id]

    const handleSignUp = () => {
        const loginBase = process.env.NEXT_PUBLIC_AUTH_LOGIN_URL ?? '/login'
        const loginUrl = new URL(loginBase)
        loginUrl.searchParams.set('redirect_uri', window.location.origin + '/' + lang)
        window.location.href = loginUrl.toString()
    }

    const cardClass = [
        'pricing-card',
        tier.highlighted ? 'pricing-card--highlighted' : '',
        tier.comingSoon ? 'pricing-card--coming-soon' : '',
    ].filter(Boolean).join(' ')

    return (
        <div className={cardClass}>
            <div className="pricing-card__header">
                <h2 className="pricing-card__name">
                    {tt.name}
                    {tier.comingSoon && (
                        <span className="pricing-card__badge">SOON</span>
                    )}
                </h2>
                <p className="pricing-card__price">{tt.price}</p>
                <p className="pricing-card__price-note">{tt.priceNote}</p>
            </div>

            <ul className="pricing-card__features">
                {tier.featureKeys.map((key) => (
                    <li key={key} className="pricing-card__feature">
                        <span className="pricing-card__check" aria-hidden="true">✓</span>
                        {t.features[key]}
                    </li>
                ))}
            </ul>

            {tier.id === 'guest' && (
                <Link href="/editor" className="pricing-card__cta pricing-card__cta--ghost">
                    {tt.cta}
                </Link>
            )}
            {tier.id === 'free' && (
                <button
                    type="button"
                    className="pricing-card__cta pricing-card__cta--primary"
                    onClick={handleSignUp}
                >
                    {tt.cta}
                </button>
            )}
            {tier.id === 'pro' && (
                <button
                    type="button"
                    className="pricing-card__cta pricing-card__cta--disabled"
                    disabled
                >
                    {tt.cta}
                </button>
            )}
        </div>
    )
}
