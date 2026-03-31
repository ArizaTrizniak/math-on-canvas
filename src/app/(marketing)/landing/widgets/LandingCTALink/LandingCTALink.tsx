'use client'

import Link from 'next/link'
import { trackAnalyticsEvent } from '@/common/utils/analytics'

interface LandingCTALinkProps {
    href: string
    className?: string
    testId?: string
    location?: string
    children: React.ReactNode
}

export function LandingCTALink({ href, className, testId, location = 'landing', children }: LandingCTALinkProps) {
    return (
        <Link
            href={href}
            className={className}
            data-testid={testId}
            onClick={() => trackAnalyticsEvent('cta_click', { location })}
        >
            {children}
        </Link>
    )
}