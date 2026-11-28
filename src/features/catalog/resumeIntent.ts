import type { AuthStatus } from '@/lib/auth/authReducer'
import { clearIntent, consumeIntent, editorDocumentHref } from './intent'

export type CatalogIntentAction =
  | { kind: 'noop' }
  | { kind: 'cleared' }
  | { kind: 'redirect'; href: string }

export interface ResolveCatalogIntentParams {
  status: AuthStatus
  modalOpen: boolean
  consume?: () => string | null
  clear?: () => void
}

/**
 * Decides whether a pending catalog open-in-editor intent should redirect, be cleared
 * as stale, or wait. Clears stale intents whenever a guest is on a catalog page with no
 * auth modal open (e.g. Back from Google, reload, or closing the modal), and waits while
 * the modal is still open so screens like ResetDoneView stay visible.
 */
export function resolveCatalogIntentAction({
  status,
  modalOpen,
  consume = consumeIntent,
  clear = clearIntent,
}: ResolveCatalogIntentParams): CatalogIntentAction {
  if (status === 'loading' || modalOpen) {
    return { kind: 'noop' }
  }
  if (status === 'guest') {
    clear()
    return { kind: 'cleared' }
  }
  const documentId = consume()
  if (!documentId) {
    return { kind: 'noop' }
  }
  return { kind: 'redirect', href: editorDocumentHref(documentId) }
}
