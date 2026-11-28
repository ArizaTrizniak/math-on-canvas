'use client'

import { useEffect } from 'react'
import { useAuthContext } from '@/lib/auth/authContext'
import { flushAnalytics } from '@/common/utils/analytics'
import { resolveCatalogIntentAction } from '../resumeIntent'

export function CatalogIntentResume() {
  const { status, nativeAuthModalOpen, lastAuthTrigger } = useAuthContext()

  // After authentication from a catalog prompt (and once any modal view has closed),
  // resume any pending "open in editor" intent regardless of filters or pagination.
  useEffect(() => {
    const decision = resolveCatalogIntentAction({
      status,
      modalOpen: nativeAuthModalOpen,
      authTrigger: lastAuthTrigger,
    })
    if (decision.kind !== 'redirect') return
    // The sign-in events were queued just now: let gtag send them before leaving the page.
    void flushAnalytics().then(() => window.location.assign(decision.href))
  }, [status, nativeAuthModalOpen, lastAuthTrigger])

  return null
}
