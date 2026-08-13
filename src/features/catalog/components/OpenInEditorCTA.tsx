'use client'

import { useEffect } from 'react'
import { useAuthContext } from '@/lib/auth/authContext'
import { saveIntent, readIntent, clearIntent } from '../intent'

interface Props {
  documentId: string
  title: string
  thumbnailUrl: string | null
  label: string
  intro: string
}

export function OpenInEditorCTA({ documentId, title, thumbnailUrl, label, intro }: Props) {
  const { status, openSignUpModal } = useAuthContext()

  // After authentication, if this page's intent is stored, open the editor with the document.
  useEffect(() => {
    if (status !== 'authenticated') return
    if (readIntent() !== documentId) return
    clearIntent()
    window.location.assign(`/editor?doc=${encodeURIComponent(documentId)}`)
  }, [status, documentId])

  const onClick = () => {
    if (status === 'authenticated') {
      window.location.assign(`/editor?doc=${encodeURIComponent(documentId)}`)
      return
    }
    saveIntent(documentId)
    openSignUpModal({ kind: 'catalogOpen', title, thumbnailUrl, intro })
  }

  return (
    <button type="button" className="catalog-cta" onClick={onClick}>
      {label}
    </button>
  )
}
