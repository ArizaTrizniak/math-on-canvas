'use client'

import Link from 'next/link'
import { useSyncExternalStore } from 'react'
import { LIST_URL_KEY, resolveBackHref } from '../docPage'

interface Props {
  lang: string
  label: string
  className?: string
}

function readStored(): string | null {
  try {
    return sessionStorage.getItem(LIST_URL_KEY)
  } catch {
    return null
  }
}

const noopSubscribe = () => () => {}

/** Link back to the catalog list the visitor came from (with its filters), or to the catalog root. */
export function BackToResults({ lang, label, className }: Props) {
  const href = useSyncExternalStore(
    noopSubscribe,
    () => resolveBackHref(readStored(), lang),
    () => `/${lang}/catalog`,
  )

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  )
}
