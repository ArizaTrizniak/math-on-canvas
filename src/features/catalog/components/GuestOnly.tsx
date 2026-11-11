'use client'

import type { ReactNode } from 'react'
import { useAuthContext } from '@/lib/auth/authContext'

/** Renders children only for visitors who are not signed in (also while auth is loading). */
export function GuestOnly({ children }: { children: ReactNode }) {
  const { status } = useAuthContext()
  return status === 'authenticated' ? null : <>{children}</>
}
