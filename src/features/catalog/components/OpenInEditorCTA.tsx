'use client'

import { useAuthContext } from '@/lib/auth/authContext'
import { clearIntent, editorDocumentHref, saveIntent } from '../intent'

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

  const onClick = () => {
    if (status === 'authenticated') {
      window.location.assign(editorDocumentHref(documentId))
      return
    }
    saveIntent(documentId)
    openSignUpModal('catalog', {
      context: { kind: 'catalogOpen', title, thumbnailUrl, intro },
      onDismiss: clearIntent,
    })
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      {label}
    </button>
  )
}
