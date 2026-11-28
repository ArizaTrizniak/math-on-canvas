'use client'

import { useEffect } from 'react'
import { useAuthContext } from '@/lib/auth/authContext'
import { flushAnalytics } from '@/common/utils/analytics'
import { consumeIntent, editorDocumentHref } from '../intent'

export function CatalogIntentResume() {
  const { status } = useAuthContext()

  // After authentication, resume any pending "open in editor" intent regardless of filters/pagination.
  useEffect(() => {
    if (status !== 'authenticated') return
    const documentId = consumeIntent()
    if (!documentId) return
    // The sign-in events were queued just now: let gtag send them before leaving the page.
    void flushAnalytics().then(() => window.location.assign(editorDocumentHref(documentId)))
  }, [status])

  return null
}
