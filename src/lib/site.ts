/**
 * Canonical origin of the public site.
 * Must match the host actually served — the bare domain 307-redirects to www,
 * so every canonical, hreflang and sitemap URL has to carry the www prefix.
 */
export const BASE_URL = 'https://www.math-on-canvas.com'

/**
 * The social card every route shares. Declared once because the width/height a
 * page advertises must match the file on disk — they used to say 1600x900 in
 * six places while the linked screenshot was really 1024x768, so scrapers
 * reserved the wrong box and `summary_large_image` cropped the 4:3 shot.
 * og-cover.png is purpose-built at Facebook's recommended 1200x630.
 */
export const OG_IMAGE = {
    url: `${BASE_URL}/images/og-cover.png`,
    width: 1200,
    height: 630,
    alt: 'Math on Canvas — math diagram and formula editor',
} as const