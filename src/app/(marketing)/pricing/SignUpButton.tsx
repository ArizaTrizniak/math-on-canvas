'use client'

import { trackAnalyticsEvent } from '@/common/utils/analytics'

interface SignUpButtonProps {
    label: string
    lang: string
}

export function SignUpButton({ label, lang }: SignUpButtonProps) {
    const handleClick = () => {
        trackAnalyticsEvent('sign_up', { source: 'pricing' })
        const loginBase = process.env.NEXT_PUBLIC_AUTH_LOGIN_URL ?? '/login'
        const loginUrl = new URL(loginBase)
        loginUrl.searchParams.set('redirect_uri', window.location.origin + '/' + lang)
        window.location.href = loginUrl.toString()
    }

    return (
        <button
            type="button"
            className="pricing-card__cta pricing-card__cta--primary"
            onClick={handleClick}
        >
            {label}
        </button>
    )
}