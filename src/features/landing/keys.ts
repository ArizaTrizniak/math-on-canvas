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

/**
 * Intrinsic pixel size of each screenshot. The filmstrip gives every card its
 * own real aspect ratio instead of forcing a shared one — that shared-ratio
 * window is what used to crop the taller shots — so next/image needs the
 * actual dimensions per shot rather than one guessed 1600x900 for all four.
 */
export const screenshotDimensions: Record<(typeof screenshotKeys)[number], { width: number; height: number }> = {
    s1: { width: 1600, height: 973 },
    s2: { width: 1600, height: 1083 },
    s3: { width: 1600, height: 912 },
    s4: { width: 1600, height: 1044 },
}

/**
 * Screenshots framed as the outcome of a diagram — export, print — rather than
 * the building of one. Matches the warm/cool split the highlight cards below
 * already use, so the same "build vs. output" grammar carries through the page.
 */
export const outputScreenshotKeys: ReadonlySet<string> = new Set(['s4'])