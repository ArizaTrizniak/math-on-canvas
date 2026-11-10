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
