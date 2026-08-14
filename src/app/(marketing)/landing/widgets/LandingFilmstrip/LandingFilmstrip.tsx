'use client'

import React from 'react'
import Image from 'next/image'

interface FilmstripImage {
    src: string
    alt: string
    tag: string
    caption: string
    width: number
    height: number
    output?: boolean
}

interface LandingFilmstripProps {
    images: FilmstripImage[]
    label: string
}

/** Tracks the user's reduced-motion preference, re-reading it if they change it. */
function usePrefersReducedMotion(): boolean {
    const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false)

    React.useEffect(() => {
        const query = window.matchMedia('(prefers-reduced-motion: reduce)')
        const sync = () => setPrefersReducedMotion(query.matches)
        sync()
        query.addEventListener('change', sync)
        return () => {
            query.removeEventListener('change', sync)
        }
    }, [])

    return prefersReducedMotion
}

/**
 * Full-width, edge-to-edge row of screenshots. Unlike the boxed carousel it
 * replaced, it never times or hides content: every card is reachable with the
 * browser's own horizontal scroll (trackpad, wheel, touch), nav buttons and
 * dots are a fallback for anyone without one. Each card keeps its own real
 * aspect ratio, so a new screenshot is just one more entry in `images` — no
 * shared window ratio left to clip against.
 */
export function LandingFilmstrip({ images, label }: LandingFilmstripProps) {
    const trackRef = React.useRef<HTMLDivElement>(null)
    const [activeIndex, setActiveIndex] = React.useState(0)
    const prefersReducedMotion = usePrefersReducedMotion()

    // Index-based navigation via scrollIntoView, not a hand-computed pixel offset:
    // with scroll-snap-type: mandatory active, a scrollBy/scrollLeft target that
    // doesn't land exactly on a snap point gets rejected back to the current
    // position by the browser — scrollIntoView is the primitive built to resolve
    // correctly against snap points, so it doesn't fight the CSS at all.
    const scrollToIndex = (index: number) => {
        const track = trackRef.current
        const card = track?.querySelectorAll<HTMLElement>('.landing__filmstrip-card')[index]
        card?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', inline: 'start', block: 'nearest' })
    }

    const scrollByCards = (direction: 1 | -1) => {
        const nextIndex = Math.min(Math.max(activeIndex + direction, 0), images.length - 1)
        scrollToIndex(nextIndex)
    }

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'ArrowRight') {
            scrollByCards(1)
            event.preventDefault()
        } else if (event.key === 'ArrowLeft') {
            scrollByCards(-1)
            event.preventDefault()
        }
    }

    // Which dot is "active" follows scroll position rather than a timer — there
    // is nothing to auto-advance here, only what the visitor actually scrolled to.
    React.useEffect(() => {
        const track = trackRef.current
        if (!track) return undefined

        let ticking = false
        const updateActive = () => {
            ticking = false
            const cards = Array.from(track.querySelectorAll<HTMLElement>('.landing__filmstrip-card'))
            const trackLeft = track.getBoundingClientRect().left
            let bestIndex = 0
            let bestDistance = Infinity
            cards.forEach((card, index) => {
                const distance = Math.abs(card.getBoundingClientRect().left - trackLeft)
                if (distance < bestDistance) {
                    bestDistance = distance
                    bestIndex = index
                }
            })
            setActiveIndex(bestIndex)
        }

        const onScroll = () => {
            if (ticking) return
            ticking = true
            window.requestAnimationFrame(updateActive)
        }

        updateActive()
        track.addEventListener('scroll', onScroll, { passive: true })
        return () => {
            track.removeEventListener('scroll', onScroll)
        }
    }, [images.length])

    return (
        <section className="landing__filmstrip">
            <div className="landing__filmstrip-lead">{label}</div>
            <div className="landing__filmstrip-row">
                <button
                    type="button"
                    className="landing__filmstrip-nav landing__filmstrip-nav--prev"
                    onClick={() => scrollByCards(-1)}
                    aria-label="Scroll to previous screenshot"
                >
                    {'‹'}
                </button>
                <div
                    className="landing__filmstrip-track"
                    ref={trackRef}
                    tabIndex={0}
                    aria-label={label}
                    onKeyDown={handleKeyDown}
                >
                    {images.map((image, index) => (
                        <div
                            className={`landing__filmstrip-card${image.output ? ' landing__filmstrip-card--output' : ''}`}
                            key={image.src}
                        >
                            <Image
                                className="landing__filmstrip-image"
                                src={image.src}
                                alt={image.alt}
                                width={image.width}
                                height={image.height}
                                priority={index === 0}
                                loading={index === 0 ? undefined : 'lazy'}
                            />
                            <div className="landing__filmstrip-cap">
                                <span className="landing__filmstrip-tag">{image.tag}</span>
                                <p>{image.caption}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <button
                    type="button"
                    className="landing__filmstrip-nav landing__filmstrip-nav--next"
                    onClick={() => scrollByCards(1)}
                    aria-label="Scroll to next screenshot"
                >
                    {'›'}
                </button>
            </div>
            <div className="landing__filmstrip-dots" role="tablist" aria-label={label}>
                {images.map((image, index) => (
                    <button
                        type="button"
                        key={image.src}
                        className={`landing__filmstrip-dot${index === activeIndex ? ' landing__filmstrip-dot--active' : ''}`}
                        onClick={() => scrollToIndex(index)}
                        role="tab"
                        aria-selected={index === activeIndex}
                        aria-label={`${label} ${index + 1}`}
                    />
                ))}
            </div>
        </section>
    )
}

export default LandingFilmstrip
