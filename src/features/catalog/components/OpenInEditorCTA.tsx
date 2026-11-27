'use client'

import { useEffect } from 'react'
import { useAuthContext } from '@/lib/auth/authContext'
import { flushAnalytics } from '@/common/utils/analytics'
import { saveIntent, readIntent, clearIntent } from '../intent'

interface Props {
  documentId: string
  title: string
  thumbnailUrl: string | null
  label: string
  intro: string
  className?: string
}

export function OpenInEditorCTA({ documentId, title, thumbnailUrl, label, intro, className = 'catalog-cta' }: Props) {
  const { status, openSignUpModal } = useAuthContext()

  // After authentication, if this page's intent is stored, open the editor with the document.
  useEffect(() => {
    if (status !== 'authenticated') return
    if (readIntent() !== documentId) return
    clearIntent()
    // The sign-in events were queued just now: let gtag send them before leaving the page.
    void flushAnalytics().then(() => window.location.assign(`/editor?doc=${encodeURIComponent(documentId)}`))
  }, [status, documentId])

  const onClick = () => {
    if (status === 'authenticated') {
      window.location.assign(`/editor?doc=${encodeURIComponent(documentId)}`)
      return
    }
    saveIntent(documentId)
    openSignUpModal('catalog', { context: { kind: 'catalogOpen', title, thumbnailUrl, intro } })
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      {label}
    </button>
  )
}
