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
 * Prefers the first known subject from Stage-1 markup (since official posters carry
 * `category: 'official-template'`), falling back to a legacy known `category`.
 */
export function resolveDocumentCategory(
  doc: { category?: string | null; subjects?: string[] | null },
): Category | null {
  for (const subject of doc.subjects ?? []) {
    if (isCategory(subject)) return subject
  }
  if (doc.category && isCategory(doc.category)) return doc.category
  return null
}

/**
 * Categories that have at least one document, in canonical `CATEGORIES` order.
 * Considers all known subjects on each document as well as any legacy `category`.
 */
export function activeCategories(
  documents: ReadonlyArray<{ category?: string | null; subjects?: string[] | null }>,
): Category[] {
  const present = new Set<Category>()
  for (const doc of documents) {
    for (const subject of doc.subjects ?? []) {
      if (isCategory(subject)) present.add(subject)
    }
    if (doc.category && isCategory(doc.category)) present.add(doc.category)
  }
  return CATEGORIES.filter((c) => present.has(c))
}
