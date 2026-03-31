'use client'

import { trackAnalyticsEvent } from '@/common/utils/analytics'

interface LandingSignInProps {
    label: string
}

export function LandingSignIn({ label }: LandingSignInProps) {
    const handleClick = () => {
        trackAnalyticsEvent('sign_in')
        const loginBase = process.env.NEXT_PUBLIC_AUTH_LOGIN_URL ?? '/login'
        const loginUrl = new URL(loginBase)
        loginUrl.searchParams.set('redirect_uri', window.location.href)
        window.location.href = loginUrl.toString()
    }

    return (
        <button type="button" className="landing__ghost" onClick={handleClick}>
            {label}
        </button>
    )
}

export default LandingSignIn