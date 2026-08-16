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
    const dialogRef = React.useRef<HTMLDialogElement>(null)
    const [activeIndex, setActiveIndex] = React.useState(0)
    const [zoomedIndex, setZoomedIndex] = React.useState<number | null>(null)
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

    // Lightbox: a native <dialog> owns top-layer stacking, so it paints above
    // everything regardless of any z-index/stacking-context quirk elsewhere on
    // the page — the class of bug a hand-rolled position:fixed overlay is
    // exposed to. showModal()/close() just mirror React state onto it.
    React.useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return
        if (zoomedIndex !== null && !dialog.open) {
            dialog.showModal()
        } else if (zoomedIndex === null && dialog.open) {
            dialog.close()
        }
    }, [zoomedIndex])

    // The dialog can also close itself natively (Escape triggers its 'cancel'
    // then 'close' events) — mirror that back into React state so the two
    // never disagree about whether it's open.
    React.useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return undefined
        const onClose = () => setZoomedIndex(null)
        dialog.addEventListener('close', onClose)
        return () => dialog.removeEventListener('close', onClose)
    }, [])

    // Body scroll locked while the lightbox is open so the page behind it
    // can't drift under the overlay.
    React.useEffect(() => {
        if (zoomedIndex === null) return undefined
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = previousOverflow
        }
    }, [zoomedIndex])

    const handleLightboxKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
        if (event.key === 'ArrowRight') {
            setZoomedIndex((current) => (current === null ? current : Math.min(current + 1, images.length - 1)))
        } else if (event.key === 'ArrowLeft') {
            setZoomedIndex((current) => (current === null ? current : Math.max(current - 1, 0)))
        }
    }

    // Nothing else renders at the dialog's own coordinates, so a click whose
    // target is the dialog element itself (not a button or the figure) is a
    // click on its ::backdrop.
    const handleDialogClick = (event: React.MouseEvent<HTMLDialogElement>) => {
        if (event.target === event.currentTarget) {
            setZoomedIndex(null)
        }
    }

    const zoomedImage = zoomedIndex === null ? null : images[zoomedIndex]
    const hasPrevZoom = zoomedIndex !== null && zoomedIndex > 0
    const hasNextZoom = zoomedIndex !== null && zoomedIndex < images.length - 1

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
                            <button
                                type="button"
                                className="landing__filmstrip-image-button"
                                onClick={() => setZoomedIndex(index)}
                                aria-label={`Zoom in on ${image.alt}`}
                            >
                                {/* The first card is the LCP candidate: preload it from
                                    <head>, load it eagerly and mark it high priority.
                                    `priority` used to cover all three, but it is
                                    deprecated since Next 16 and never set
                                    fetchPriority on the <img> itself. */}
                                <Image
                                    className="landing__filmstrip-image"
                                    src={image.src}
                                    alt={image.alt}
                                    width={image.width}
                                    height={image.height}
                                    preload={index === 0}
                                    loading={index === 0 ? 'eager' : 'lazy'}
                                    fetchPriority={index === 0 ? 'high' : 'auto'}
                                />
                            </button>
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
            <dialog
                ref={dialogRef}
                className="landing__filmstrip-lightbox"
                aria-label={zoomedImage?.alt}
                onClick={handleDialogClick}
                onKeyDown={handleLightboxKeyDown}
            >
                {zoomedImage && (
                    <>
                        <button
                            type="button"
                            className="landing__filmstrip-lightbox-close"
                            onClick={() => setZoomedIndex(null)}
                            aria-label="Close"
                        >
                            {'×'}
                        </button>
                        {hasPrevZoom && (
                            <button
                                type="button"
                                className="landing__filmstrip-lightbox-nav landing__filmstrip-lightbox-nav--prev"
                                onClick={() => setZoomedIndex((current) => (current === null ? current : current - 1))}
                                aria-label="Previous screenshot"
                            >
                                {'‹'}
                            </button>
                        )}
                        <figure className="landing__filmstrip-lightbox-figure">
                            <Image
                                className="landing__filmstrip-lightbox-image"
                                src={zoomedImage.src}
                                alt={zoomedImage.alt}
                                width={zoomedImage.width}
                                height={zoomedImage.height}
                            />
                            <figcaption className="landing__filmstrip-lightbox-caption">{zoomedImage.caption}</figcaption>
                        </figure>
                        {hasNextZoom && (
                            <button
                                type="button"
                                className="landing__filmstrip-lightbox-nav landing__filmstrip-lightbox-nav--next"
                                onClick={() => setZoomedIndex((current) => (current === null ? current : current + 1))}
                                aria-label="Next screenshot"
                            >
                                {'›'}
                            </button>
                        )}
                    </>
                )}
            </dialog>
        </section>
    )
}

export default LandingFilmstrip