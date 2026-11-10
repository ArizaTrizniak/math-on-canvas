import Link from 'next/link'

interface Props {
  nextHref: string | null
  firstHref: string | null
  nextLabel: string
  firstLabel: string
  label: string
}

/** Cursor pagination: the API only returns a forward cursor, so "back" means back to the first page. */
export function CatalogPagination({ nextHref, firstHref, nextLabel, firstLabel, label }: Props) {
  if (!nextHref && !firstHref) return null

  return (
    <nav className="catalog-pagination" aria-label={label}>
      {firstHref && <Link href={firstHref} className="catalog-pagination__link">{firstLabel}</Link>}
      {nextHref && (
        <Link href={nextHref} className="catalog-pagination__link catalog-pagination__link--next">
          {nextLabel}
        </Link>
      )}
    </nav>
  )
}
