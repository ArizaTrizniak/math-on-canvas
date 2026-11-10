import Link from 'next/link'
import './CatalogEmptyState.css'

export interface CatalogEmptyStateProps {
  title: string
  body: string
  /** Shown only when there are filters to clear. */
  resetHref?: string
  resetLabel: string
  createLabel: string
}

export function CatalogEmptyState({ title, body, resetHref, resetLabel, createLabel }: CatalogEmptyStateProps) {
  return (
    <div className="catalog-empty">
      <span className="catalog-empty__glyph" aria-hidden="true">∅</span>
      <h2 className="catalog-empty__title">{title}</h2>
      <p className="catalog-empty__body">{body}</p>
      <div className="catalog-empty__actions">
        {resetHref && (
          <Link href={resetHref} className="catalog-empty__btn catalog-empty__btn--primary">
            {resetLabel}
          </Link>
        )}
        <Link href="/editor" className="catalog-empty__btn">
          {createLabel}
        </Link>
      </div>
    </div>
  )
}
