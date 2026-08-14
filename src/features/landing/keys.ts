/**
 * Ordered content keys for the landing sections.
 * Shared by the page component and the JSON-LD builder so the rendered copy and
 * the structured data can never drift apart.
 */

export const featureKeys = [
    'formulas', 'shapes3d', 'shapes', 'symbols', 'pages',
    'export', 'draw', 'tools', 'source', 'languages',
] as const

export const highlightKeys = ['visual', 'shapes3d', 'geometry', 'symbols', 'pdf', 'export', 'pages', 'library'] as const

/**
 * Highlights about getting work *out* of the editor, as opposed to building it.
 * Drives the card accent so the grid reads as two families at a glance.
 */
export const outputHighlightKeys: ReadonlySet<string> = new Set(['pdf', 'export', 'pages'])

export const stepKeys = ['open', 'place', 'adjust', 'export'] as const

export const audienceKeys = ['teachers', 'tutors', 'students'] as const

export const comingKeys = ['ai', 'cloud', 'share'] as const

export const faqKeys = ['account', 'latex', 'poster', 'edit', 'price', 'license'] as const

export const screenshotKeys = ['s1', 's2', 's3', 's4'] as const