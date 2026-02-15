import React from 'react'
import { useTranslation } from 'react-i18next'
import LanguageSwitch from './widgets/LanguageSwitch/LandingLanguageSwitch'
import './LandingPage.css'
import { trackAnalyticsEvent } from '@/common/utils/analytics'

const logo = '/images/logo.svg'
const screen1Webp = '/images/screen1.webp'
const screen2Webp = '/images/screen2.webp'
const screen3Webp = '/images/screen3.webp'
const screen4Webp = '/images/screen4.webp'

type FeatureKey = 'easy' | 'formulas' | 'shapes' | 'export' | 'customize'
type HighlightKey = 'pdf' | 'pages' | 'symbols' | 'visual' | 'library' | 'geometry'

const featureKeys: FeatureKey[] = ['easy', 'formulas', 'shapes', 'export', 'customize']
const highlightKeys: HighlightKey[] = ['pdf', 'pages', 'symbols', 'visual', 'library', 'geometry']

function buildFeatureMap(t: ReturnType<typeof useTranslation>['t']): Record<FeatureKey, string> {
    return {
        easy: t('features.easy'),
        formulas: t('features.formulas'),
        shapes: t('features.shapes'),
        export: t('features.export'),
        customize: t('features.customize')
    }
}

function buildHighlightMap(
    t: ReturnType<typeof useTranslation>['t']
): Record<HighlightKey, { title: string; description: string }> {
    return {
        symbols: { title: t('highlights.symbols.title'), description: t('highlights.symbols.description') },
        pdf: { title: t('highlights.pdf.title'), description: t('highlights.pdf.description') },
        pages: { title: t('highlights.pages.title'), description: t('highlights.pages.description') },
        visual: { title: t('highlights.visual.title'), description: t('highlights.visual.description') },
        library: { title: t('highlights.library.title'), description: t('highlights.library.description') },
        geometry: { title: t('highlights.geometry.title'), description: t('highlights.geometry.description') }
    }
}


export const LandingPage: React.FC = () => {
    const { t } = useTranslation('landing')
    const [activeSlide, setActiveSlide] = React.useState(0)
    const [isCarouselActive, setIsCarouselActive] = React.useState(false)
    const carouselImages = React.useMemo(() => [screen1Webp, screen2Webp, screen3Webp, screen4Webp], [])

    const features = buildFeatureMap(t)
    const highlights = buildHighlightMap(t)

    const handlePrimaryClick = () => {
        trackAnalyticsEvent('editor_start', { source: 'hero_cta' })
        window.location.href = '/editor'
    }

    const handleHeaderClick = () => {
        trackAnalyticsEvent('editor_start', { source: 'header_link' })
        window.location.href = '/editor'
    }

    React.useEffect(() => {
        const preload = document.createElement('link')
        preload.rel = 'preload'
        preload.as = 'image'
        preload.href = carouselImages[0]
        document.head.appendChild(preload)
        return () => {
            document.head.removeChild(preload)
        }
    }, [carouselImages])

    React.useEffect(() => {
        if (!isCarouselActive) return undefined
        const id = window.setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % carouselImages.length)
        }, 5200)
        return () => {
            window.clearInterval(id)
        }
    }, [carouselImages.length, isCarouselActive])

    const activateCarousel = () => setIsCarouselActive(true)

    const goToSlide = (index: number) => {
        activateCarousel()
        setActiveSlide((index + carouselImages.length) % carouselImages.length)
    }

    const nextSlide = () => goToSlide(activeSlide + 1)
    const prevSlide = () => goToSlide(activeSlide - 1)

    return (
        <div className="landing">
            <div className="landing__texture" aria-hidden="true">
                <span className="landing__grid" />
            </div>
            <header className="landing__header">
                <div className="landing__brand">
                    <img className="landing__brand-logo" src={logo} alt={t('brand')} />
                    <div>
                        <div className="landing__brand-title">
                            {t('brand')}
                            <span className="landing__beta-badge">BETA</span>
                        </div>
                        <div className="landing__brand-subtitle">{t('hero.subtitle')}</div>
                    </div>
                </div>

                <div className="landing__actions">
                    <LanguageSwitch />
                    <button
                        type="button"
                        className="landing__ghost"
                        onClick={handleHeaderClick}
                    >
                        {t('cta.ready')}
                    </button>
                </div>
            </header>

            <main className="landing__main">
                <section className="landing__hero">
                    <div className="landing__copy">
                        <div className="landing__pill">{t('hero.tag')}</div>
                        <h1 className="landing__title">{t('hero.title')}</h1>
                        <p className="landing__narrative">{t('hero.narrative')}</p>

                        <div className="landing__controls">
                            <button
                                type="button"
                                className="landing__cta"
                                data-testid="landing-start"
                                onClick={handlePrimaryClick}
                            >
                                {t('cta.ready')}
                            </button>
                        </div>

                        <div className="landing__features">
                            <div className="landing__features-title">{t('featuresTitle')}</div>
                            <ul>
                                {featureKeys.map((key) => (
                                    <li key={key}>{features[key]}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="landing__preview">
                        <div className="landing__preview-header">
                            <div className="landing__preview-pips">
                                <span className="landing__pip landing__pip--red" />
                                <span className="landing__pip landing__pip--yellow" />
                                <span className="landing__pip landing__pip--green" />
                            </div>
                        </div>

                        <div className="landing__preview-body">
                            <div className="landing__carousel" aria-label={t('preview.caption')}>
                                <div className="landing__carousel-window">
                                    <div
                                        className="landing__carousel-track"
                                        style={{ transform: `translateX(-${activeSlide * 100}%)` }}
                                    >
                                        {carouselImages.map((image, index) => (
                                            <picture key={image} className="landing__carousel-slide">
                                                <source srcSet={image} type="image/webp" />
                                                <img
                                                    className="landing__carousel-image"
                                                    src={image}
                                                    alt={`${t('preview.caption')} ${index + 1}`}
                                                    decoding="async"
                                                    fetchPriority={index === activeSlide ? 'high' : 'low'}
                                                    loading={index === 0 ? 'eager' : 'lazy'}
                                                    width={1600}
                                                    height={900}
                                                />
                                            </picture>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        className="landing__carousel-control landing__carousel-control--prev"
                                        onClick={prevSlide}
                                        aria-label="Previous slide"
                                    >
                                        {'<'}
                                    </button>
                                    <button
                                        type="button"
                                        className="landing__carousel-control landing__carousel-control--next"
                                        onClick={nextSlide}
                                        aria-label="Next slide"
                                    >
                                        {'>'}
                                    </button>
                                </div>
                                <div className="landing__carousel-footer">
                                    <div className="landing__carousel-caption">
                                        {t('preview.caption')} | {activeSlide + 1}/{carouselImages.length}
                                    </div>
                                    <div className="landing__carousel-dots" role="tablist">
                                        {carouselImages.map((image, index) => (
                                            <button
                                                type="button"
                                                key={index}
                                                className={`landing__carousel-dot${
                                                    activeSlide === index ? ' landing__carousel-dot--active' : ''
                                                }`}
                                                onClick={() => goToSlide(index)}
                                                aria-label={`${t('preview.caption')} ${index + 1}`}
                                                aria-selected={activeSlide === index}
                                                role="tab"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="landing__highlights">
                    <div className="landing__highlights-header">
                        <h2>{t('highlightsTitle')}</h2>
                        <p>{t('highlightsSubtitle')}</p>
                    </div>
                    <div className="landing__highlights-grid">
                        {highlightKeys.map((key) => (
                            <article className="landing__highlight-card" key={key}>
                                <div className="landing__highlight-body">
                                    <h3>{highlights[key].title}</h3>
                                    <p>{highlights[key].description}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            </main>

            <footer className="landing__footer">
                {t('footer')}
                <span className="landing__version" style={{ opacity: 0.5, marginLeft: '1em' }}>v{process.env.NEXT_PUBLIC_APP_VERSION}</span>
            </footer>
        </div>
    )
}

export default LandingPage
