'use client'

import { trackAnalyticsEvent } from '@/common/utils/analytics'

interface LandingSignInProps {
    label: string
}

export function LandingSignIn({ label }: LandingSignInProps) {
    const handleClick = () => {
        trackAnalyticsEvent('sign_in')
        const signinUrl = `/auth/signin?redirect_uri=${encodeURIComponent(window.location.pathname + window.location.search)}`
        window.location.href = signinUrl
    }

    return (
        <button type="button" className="landing__ghost" onClick={handleClick}>
            {label}
        </button>
    )
}

export default LandingSignIn