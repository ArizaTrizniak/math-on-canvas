export const CATEGORIES = [
  'algebra', 'geometry', 'calculus', 'statistics', 'trigonometry', 'number-theory', 'other',
] as const

export type Category = typeof CATEGORIES[number]

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value)
}

/** Turn a slug like 'number-theory' into a human label 'Number Theory'. */
export function humanizeSlug(slug: string): string {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}
