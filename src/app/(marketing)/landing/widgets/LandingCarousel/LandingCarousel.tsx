'use client'

import React from 'react'
import Image from 'next/image'

interface LandingCarouselProps {
    images: string[]
    captionText: string
}

export function LandingCarousel({ images, captionText }: LandingCarouselProps) {
    const [activeSlide, setActiveSlide] = React.useState(0)
    const [isCarouselActive, setIsCarouselActive] = React.useState(false)

    React.useEffect(() => {
        if (!isCarouselActive) return undefined
        const id = window.setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % images.length)
        }, 5200)
        return () => {
            window.clearInterval(id)
        }
    }, [images.length, isCarouselActive])

    const goToSlide = (index: number) => {
        setIsCarouselActive(true)
        setActiveSlide((index + images.length) % images.length)
    }

    return (
        <div className="landing__carousel" aria-label={captionText}>
            <div className="landing__carousel-window">
                <div
                    className="landing__carousel-track"
                    style={{ transform: `translateX(-${activeSlide * 100}%)` }}
                >
                    {images.map((image, index) => (
                        <div key={image} className="landing__carousel-slide">
                            <Image
                                className="landing__carousel-image"
                                src={image}
                                alt={`${captionText} ${index + 1}`}
                                priority={index === 0}
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
                            key={image}
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