export const CATEGORIES = [
  'algebra', 'geometry', 'calculus', 'statistics', 'trigonometry', 'number-theory', 'other',
] as const

export type Category = typeof CATEGORIES[number]

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value)
}

/** Short math glyph shown next to a category label. */
export const CATEGORY_GLYPHS: Record<Category, string> = {
  algebra: 'x²',
  geometry: '△',
  calculus: '∫',
  statistics: 'σ',
  trigonometry: 'sin',
  'number-theory': 'ℕ',
  other: '∗',
}

/** Glyph for the "all categories" choice. */
export const ALL_GLYPH = '∀'

export function categoryGlyph(slug: string | null): string {
  return slug && isCategory(slug) ? CATEGORY_GLYPHS[slug] : CATEGORY_GLYPHS.other
}

/** Turn a slug like 'number-theory' into a human label 'Number Theory'. */
export function humanizeSlug(slug: string): string {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

/**
 * Resolve the primary catalog category to display/link for a document.
 * Reads only Stage-1 `subjects` so badges, breadcrumbs, and related links stay
 * consistent with `?subjects=` API filtering.
 */
export function resolveDocumentCategory(
  doc: { subjects?: string[] | null },
): Category | null {
  for (const subject of doc.subjects ?? []) {
    if (isCategory(subject)) return subject
  }
  return null
}

/**
 * Categories that have at least one document, in canonical `CATEGORIES` order.
 * Reads only `subjects` to match the `?subjects=` query used by category pages.
 */
export function activeCategories(
  documents: ReadonlyArray<{ subjects?: string[] | null }>,
): Category[] {
  const present = new Set<Category>()
  for (const doc of documents) {
    for (const subject of doc.subjects ?? []) {
      if (isCategory(subject)) present.add(subject)
    }
  }
  return CATEGORIES.filter((c) => present.has(c))
}

/**
 * Categories with `count > 0` from catalog `facets.subjects`, in canonical `CATEGORIES` order.
 * Returns `null` when the API response did not include `facets.subjects`.
 */
export function activeCategoriesFromFacets(
  facets?: { subjects?: ReadonlyArray<{ id: string; count: number }> } | null,
): Category[] | null {
  if (!facets?.subjects) return null
  const present = new Set<Category>()
  for (const facet of facets.subjects) {
    if (facet.count > 0 && isCategory(facet.id)) present.add(facet.id)
  }
  return CATEGORIES.filter((c) => present.has(c))
}
