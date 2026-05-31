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

/** The documentId is the last '-'-separated segment of the slug. */
export function parseIdFromSlug(slug: string): string {
  const idx = slug.lastIndexOf('-')
  return idx === -1 ? slug : slug.slice(idx + 1)
}
