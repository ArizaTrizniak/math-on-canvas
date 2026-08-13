'use client'

import { useEffect } from 'react'
import { shouldRecordView, sendViewBeacon } from '../viewBeacon'

export function ViewBeacon({ documentId }: { documentId: string }) {
  useEffect(() => {
    if (shouldRecordView(documentId)) sendViewBeacon(documentId)
  }, [documentId])
  return null
}
