'use client'

import { useEffect, useId, useRef, useState } from 'react'

interface Props {
  text: string
  expandLabel: string
  collapseLabel: string
  className?: string
  /** Texts up to this length are shown in full, without a toggle. */
  threshold?: number
}

export function ExpandableText({ text, expandLabel, collapseLabel, className = '', threshold = 200 }: Props) {
  const [expanded, setExpanded] = useState(false)
  // Whether the clamped text actually fits in three lines; measured on the client.
  const [fits, setFits] = useState(false)
  const ref = useRef<HTMLParagraphElement>(null)
  const id = useId()
  const long = text.length > threshold

  useEffect(() => {
    const el = ref.current
    if (!el || !long) return
    // ResizeObserver also fires once right after observe(), which gives the first measurement.
    const ro = new ResizeObserver(() => {
      if (el.classList.contains('is-clamped')) setFits(el.scrollHeight <= el.clientHeight + 1)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [long])

  const clamped = long && !expanded && !fits
  const showToggle = long && (expanded || !fits)

  return (
    <>
      <p ref={ref} id={id} className={`${className} ${clamped ? 'is-clamped' : ''}`.trim()}>
        {text}
      </p>
      {showToggle && (
        <button
          type="button"
          className="catalog-expand"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? collapseLabel : expandLabel}
        </button>
      )}
    </>
  )
}
