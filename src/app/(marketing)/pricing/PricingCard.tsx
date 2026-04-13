import Link from 'next/link'
import type { Tier } from '@/lib/pricing/tiers'
import { SignUpButton } from './SignUpButton'
import type pricingEN from '@/lib/i18n/locales/en/pricing.json'

type PricingT = typeof pricingEN

interface PricingCardProps {
    tier: Tier
    t: PricingT
    lang: string
}

export function PricingCard({ tier, t, lang }: PricingCardProps) {
    const tt = t.tiers[tier.id as keyof typeof t.tiers]

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
                        {t.features[key as keyof typeof t.features]}
                    </li>
                ))}
            </ul>

            {tier.id === 'guest' && (
                <Link href="/editor" className="pricing-card__cta pricing-card__cta--ghost">
                    {tt.cta}
                </Link>
            )}
            {tier.id === 'free' && (
                <SignUpButton label={tt.cta} lang={lang} />
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
