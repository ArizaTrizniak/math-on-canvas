'use client'

import React from 'react'
import Image from 'next/image'

interface CarouselImage {
    src: string
    alt: string
}

interface LandingCarouselProps {
    images: CarouselImage[]
    captionText: string
}

const SLIDE_INTERVAL_MS = 5200

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

export function LandingCarousel({ images, captionText }: LandingCarouselProps) {
    const [activeSlide, setActiveSlide] = React.useState(0)
    const [isPaused, setIsPaused] = React.useState(false)
    const prefersReducedMotion = usePrefersReducedMotion()

    // Advances on its own from the moment it mounts. It used to wait for a click
    // before the first tick, which left the carousel frozen on slide 1 for anyone
    // who never touched it. Holds still while hovered, focused, or when the
    // visitor has asked for reduced motion; `activeSlide` in the deps restarts
    // the timer after a manual jump so the next slide gets a full interval.
    React.useEffect(() => {
        if (isPaused || prefersReducedMotion || images.length < 2) return undefined
        const id = window.setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % images.length)
        }, SLIDE_INTERVAL_MS)
        return () => {
            window.clearInterval(id)
        }
    }, [images.length, isPaused, prefersReducedMotion, activeSlide])

    const goToSlide = (index: number) => {
        setActiveSlide((index + images.length) % images.length)
    }

    return (
        <div
            className="landing__carousel"
            aria-label={captionText}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocusCapture={() => setIsPaused(true)}
            onBlurCapture={() => setIsPaused(false)}
        >
            <div className="landing__carousel-window">
                <div
                    className="landing__carousel-track"
                    style={{ transform: `translateX(-${activeSlide * 100}%)` }}
                >
                    {images.map((image, index) => (
                        <div key={image.src} className="landing__carousel-slide">
                            <Image
                                className="landing__carousel-image"
                                src={image.src}
                                alt={image.alt}
                                priority={index === 0}
                                loading={index === 0 ? undefined : 'lazy'}
                                width={1600}
                                height={900}
                            />
                        </div>
                    ))}
                </div>
                <button
                    type="button"
                    className="landing__carousel-control landing__carousel-control--prev"
                    onClick={() => goToSlide(activeSlide - 1)}
                    aria-label="Previous slide"
                >
                    {'<'}
                </button>
                <button
                    type="button"
                    className="landing__carousel-control landing__carousel-control--next"
                    onClick={() => goToSlide(activeSlide + 1)}
                    aria-label="Next slide"
                >
                    {'>'}
                </button>
            </div>
            <div className="landing__carousel-footer">
                <div className="landing__carousel-caption">
                    {captionText} | {activeSlide + 1}/{images.length}
                </div>
                <div className="landing__carousel-dots" role="tablist">
                    {images.map((image, index) => (
                        <button
                            type="button"
                            key={image.src}
                            className={`landing__carousel-dot${activeSlide === index ? ' landing__carousel-dot--active' : ''}`}
                            onClick={() => goToSlide(index)}
                            aria-label={`${captionText} ${index + 1}`}
                            aria-selected={activeSlide === index}
                            role="tab"
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default LandingCarousel