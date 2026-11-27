'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { initAnalytics, syncInternalFromRole, trackPageView } from '@/common/utils/analytics'
import { useAuthContext } from '@/lib/auth/authContext'

export function AnalyticsInit() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { user } = useAuthContext()

    useEffect(() => { initAnalytics() }, [])

    useEffect(() => {
        if (user?.role) {
            syncInternalFromRole(user.role)
        }
    }, [user?.role])

    useEffect(() => {
        const search = searchParams.toString()
        trackPageView(pathname + (search ? `?${search}` : ''))
    }, [pathname, searchParams])

    return null
}