import type { AuthModalTrigger } from '@/common/analytics/events'
import type { AuthStatus } from '@/lib/auth/authReducer'
import { clearIntent, consumeIntent, editorDocumentHref } from './intent'

export type CatalogIntentAction =
  | { kind: 'noop' }
  | { kind: 'cleared' }
  | { kind: 'redirect'; href: string }

export interface ResolveCatalogIntentParams {
  status: AuthStatus
  modalOpen: boolean
  authTrigger: AuthModalTrigger | null
  consume?: () => string | null
  clear?: () => void
}

/**
 * Decides whether a pending catalog open-in-editor intent should redirect, be cleared
 * as stale, or wait. Only sign-ins originating from `trigger === 'catalog'` resume
 * into the editor, and only after the auth modal has closed (so e.g. ResetDoneView stays
 * visible until the user clicks Continue).
 */
export function resolveCatalogIntentAction({
  status,
  modalOpen,
  authTrigger,
  consume = consumeIntent,
  clear = clearIntent,
}: ResolveCatalogIntentParams): CatalogIntentAction {
  if (status === 'loading' || modalOpen) {
    return { kind: 'noop' }
  }
  if (status === 'guest' || authTrigger !== 'catalog') {
    clear()
    return { kind: 'cleared' }
  }
  const documentId = consume()
  if (!documentId) {
    return { kind: 'noop' }
  }
  return { kind: 'redirect', href: editorDocumentHref(documentId) }
}
