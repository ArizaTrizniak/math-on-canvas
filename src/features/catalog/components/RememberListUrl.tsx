'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { LIST_URL_KEY } from '../docPage'

/** Stores the current catalog list URL so a document page can link back to it. Renders nothing. */
export function RememberListUrl() {
  const pathname = usePathname()
  const query = useSearchParams().toString()

  useEffect(() => {
    try {
      sessionStorage.setItem(LIST_URL_KEY, query ? `${pathname}?${query}` : pathname)
    } catch { /* storage unavailable */ }
  }, [pathname, query])

  return null
}
