# Pricing Page Design

**Date:** 2026-04-12
**Status:** Approved

---

## Goal

Add a `/[lang]/pricing` page that presents the three-tier feature structure (Guest / Free / Pro) using the architecture that is correct from day one — so the paid tier can be activated later without restructuring. Currently Pro is shown as `coming soon`.

---

## Routing

New Server Component at `src/app/[lang]/pricing/page.tsx`. Reuses the existing `[lang]` segment so it inherits `generateMetadata` with canonical URL, hreflang for all 4 languages (EN/RU/ES/DE), and Open Graph tags. No new layout needed.

---

## File Structure

```
src/
├── app/
│   └── [lang]/
│       └── pricing/
│           └── page.tsx                  # Server Component — reads user from headers
├── app/
│   └── (marketing)/
│       └── pricing/
│           ├── PricingPage.tsx           # top-level page component
│           ├── PricingCard.tsx           # single tier card
│           └── PricingPage.css
├── lib/
│   ├── pricing/
│   │   └── tiers.ts                      # static tier definitions (feature keys)
│   └── i18n/
│       └── locales/
│           ├── en/pricing.json
│           ├── ru/pricing.json
│           ├── es/pricing.json
│           └── de/pricing.json
```

---

## Data Model

`tiers.ts` is the single source of truth — a static array of three objects:

```ts
type Tier = {
  id: 'guest' | 'free' | 'pro'
  highlighted: boolean    // Free tier gets visual emphasis
  comingSoon: boolean     // Pro = true until payment is wired up
  features: string[]      // i18n keys for feature list items
}
```

Activating the paid tier in the future requires only setting `comingSoon: false` on the Pro tier and wiring up payment logic. The page structure does not change.

---

## Tier Content

### Guest — free, no registration
- Full editor: LaTeX formulas (MathJax), 3D shapes (cube, prism, pyramid, sphere, cone, cylinder with real-time mouse rotation), 2D shapes (rectangles, circles, triangles, polygons, arrows, parabolas, arcs, sectors)
- Text with font and style selection
- Free drawing, layers, grid, undo/redo
- Export to PDF, PNG, SVG
- Interface in 4 languages (EN / RU / ES / DE)

### Free — registered account (everything in Guest, plus:)
- Save project source files to disk — reload and edit later

### Pro — coming soon (everything in Free, plus:)
- AI assistant — generate shapes and formulas from a text prompt
- Cloud project storage
- Share by link (read-only)

---

## Visual Design

Three columns on desktop, stacked on mobile. Reuses existing CSS variables and patterns from `LandingPage.css`.

| Tier | Visual treatment |
|------|-----------------|
| Guest | Standard card |
| Free | Highlighted — border accent + background tint (`.pricing-card--highlighted`) |
| Pro | Dimmed — reduced opacity + `coming soon` badge, CTA disabled |

**CTAs:**
- Guest → "Open editor" (links to `/editor`)
- Free → "Sign up" (links to auth login URL)
- Pro → disabled button labeled "Coming soon"

---

## SEO

- `generateMetadata` in `[lang]/pricing/page.tsx`: unique `<title>`, `<description>`, canonical, hreflang × 4
- `schema.org/Offer` JSON-LD for Guest and Free tiers in `<head>`

---

## Navigation

- Link "Pricing" added to landing page header — between `LanguageSwitch` and Sign In button
- Link "Pricing" added to landing page footer

---

## Future Considerations (out of scope for this implementation)

- **Watermark on Guest exports** — add a watermark to PDF/PNG/SVG exports for unauthenticated users as an additional registration incentive. Deferred; current focus is on "save source files" as the primary conversion driver.
- **Pro CTA: "Notify me"** — email capture for users interested in the paid tier. Deferred until payment infrastructure exists.
- **Collaboration** — multi-user editing as a potential Pro feature.