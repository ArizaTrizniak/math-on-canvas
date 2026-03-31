'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { initAnalytics, trackPageView } from '@/common/utils/analytics'

export function AnalyticsInit() {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => { initAnalytics() }, [])

    useEffect(() => {
        const search = searchParams.toString()
        trackPageView(pathname + (search ? `?${search}` : ''))
    }, [pathname, searchParams])

    return null
}