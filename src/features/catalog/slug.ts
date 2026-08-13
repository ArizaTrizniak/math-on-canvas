function kebab(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Slug = kebab(title) + '-' + id. Falls back to the id when the title kebabs to empty. */
export function buildSlug(title: string, documentId: string): string {
  const base = kebab(title)
  return base ? `${base}-${documentId}` : documentId
}

/** UUID v4 (the documentId format) at the tail of the slug. */
const TRAILING_UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Recover the documentId from a slug. documentIds are UUIDs (which contain dashes),
 * so we match the trailing UUID rather than splitting on the last dash.
 * Falls back to the whole slug when no UUID is present.
 */
export function parseIdFromSlug(slug: string): string {
  return slug.match(TRAILING_UUID)?.[0] ?? slug
}
