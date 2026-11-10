export const FILTER_KEYS = ['category', 'tags', 'language', 'sort'] as const
export type FilterKey = typeof FILTER_KEYS[number]

/** Filters that narrow the result set. Sorting only reorders it. */
const NARROWING_KEYS: readonly FilterKey[] = ['category', 'tags', 'language']

/** Normalize a `tags` query value: comma-split, trimmed, lower-cased, no empties, no duplicates. */
export function parseTags(raw: string | string[] | null | undefined): string[] {
  if (!raw) return []
  const joined = Array.isArray(raw) ? raw.join(',') : raw
  const tags = joined.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
  return [...new Set(tags)]
}

function toHref(pathname: string, params: URLSearchParams): string {
  const qs = params.toString()
  return qs ? `${pathname}?${qs}` : pathname
}

/**
 * Catalog URL with `patch` applied to `current`. `null` or `''` removes a key.
 * Changing any filter resets pagination, so the cursor is dropped unless the patch sets it.
 */
export function buildCatalogHref(
  pathname: string,
  current: URLSearchParams,
  patch: Partial<Record<FilterKey | 'cursor', string | null>>,
): string {
  const params = new URLSearchParams(current.toString())
  if (!('cursor' in patch)) params.delete('cursor')
  for (const [key, value] of Object.entries(patch)) {
    if (value) params.set(key, value)
    else params.delete(key)
  }
  return toHref(pathname, params)
}

/** Catalog URL without any filters or cursor; unrelated params (e.g. utm) are kept. */
export function clearFiltersHref(pathname: string, current: URLSearchParams): string {
  const params = new URLSearchParams(current.toString())
  for (const key of FILTER_KEYS) params.delete(key)
  params.delete('cursor')
  return toHref(pathname, params)
}

export function hasActiveFilters(current: URLSearchParams): boolean {
  return NARROWING_KEYS.some((key) => Boolean(current.get(key)))
}
