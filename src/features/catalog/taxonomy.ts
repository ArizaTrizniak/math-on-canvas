export const CATEGORIES = [
  'algebra', 'geometry', 'calculus', 'statistics', 'trigonometry', 'number-theory', 'other',
] as const

export type Category = typeof CATEGORIES[number]

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value)
}
