'use client'

import { useEffect } from 'react'
import { useAuthContext } from '@/lib/auth/authContext'
import { flushAnalytics } from '@/common/utils/analytics'
import { resolveCatalogIntentAction } from '../resumeIntent'

export function CatalogIntentResume() {
  const { status, nativeAuthModalOpen } = useAuthContext()

  // After authentication (and once any modal view has closed), resume a pending
  // "open in editor" intent regardless of catalog filters or pagination.
  useEffect(() => {
    const decision = resolveCatalogIntentAction({
      status,
      modalOpen: nativeAuthModalOpen,
    })
    if (decision.kind !== 'redirect') return
    // The sign-in events were queued just now: let gtag send them before leaving the page.
    void flushAnalytics().then(() => window.location.assign(decision.href))
  }, [status, nativeAuthModalOpen])

  return null
}
