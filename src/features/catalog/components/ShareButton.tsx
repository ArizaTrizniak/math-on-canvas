'use client'

import { useEffect, useRef, useState } from 'react'
import './ShareButton.css'

interface Props {
  label: string
  copiedLabel: string
  className?: string
  /** Keep the label for screen readers only (square icon button). */
  iconOnly?: boolean
}

const TOAST_MS = 2200

export function ShareButton({ label, copiedLabel, className, iconOnly = false }: Props) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const onClick = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), TOAST_MS)
    } catch {
      /* user cancelled share or clipboard unavailable — no-op */
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={onClick}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        <span className={iconOnly ? 'catalog-sr-only' : 'catalog-share__label'}>{label}</span>
      </button>
      <div className="catalog-toast-region" role="status" aria-live="polite">
        {copied && <div className="catalog-toast">{copiedLabel}</div>}
      </div>
    </>
  )
}
