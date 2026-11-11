'use client'

import { useId, useState } from 'react'

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
  const id = useId()

  if (text.length <= threshold) return <p className={className}>{text}</p>

  return (
    <>
      <p id={id} className={`${className} ${expanded ? '' : 'is-clamped'}`.trim()}>
        {text}
      </p>
      <button
        type="button"
        className="catalog-expand"
        aria-expanded={expanded}
        aria-controls={id}
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? collapseLabel : expandLabel}
      </button>
    </>
  )
}
