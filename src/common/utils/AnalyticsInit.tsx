'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { initAnalytics, syncInternalFromRole, trackPageView } from '@/common/utils/analytics'
import { useAuthContext } from '@/lib/auth/authContext'

export function AnalyticsInit() {
    const pathname = usePathname()
    const { user } = useAuthContext()

    useEffect(() => { initAnalytics() }, [])

    useEffect(() => {
        if (user?.role) {
            syncInternalFromRole(user.role)
        }
    }, [user?.role])

    // One page_view per pathname change. The query is not tracked: it would turn one-shot
    // markers (?auth_result, ?auth_error) into extra page views (BL-0009).
    useEffect(() => {
        trackPageView(pathname)
    }, [pathname])

    return null
}