'use client'

import Link from 'next/link'
import { track } from '@/common/analytics/track'
import type { CtaLocation } from '@/common/analytics/events'

interface LandingCTALinkProps {
    href: string
    className?: string
    testId?: string
    location?: CtaLocation
    children: React.ReactNode
}

export function LandingCTALink({ href, className, testId, location = 'landing', children }: LandingCTALinkProps) {
    return (
        <Link
            href={href}
            className={className}
            data-testid={testId}
            onClick={() => track({ name: 'cta_click', location })}
        >
            {children}
        </Link>
    )
}