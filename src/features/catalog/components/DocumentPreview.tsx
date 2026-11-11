'use client'

import { useRef, useState, type MouseEvent } from 'react'
import { categoryGlyph } from '../taxonomy'
import { firstSheetWithImage, type PageStripItem } from '../docPage'
import './DocumentPreview.css'

interface Labels {
  region: string
  fullscreen: string
  close: string
  strip: string
  /** "Лист {n} из {total}" */
  page: string
  prev: string
  next: string
}

interface Props {
  pages: PageStripItem[]
  alt: string
  orientation: 'portrait' | 'landscape'
  category: string | null
  labels: Labels
}

export function DocumentPreview({ pages, alt, orientation, category, labels }: Props) {
  const [current, setCurrent] = useState(() => firstSheetWithImage(pages))
  const dialogRef = useRef<HTMLDialogElement>(null)

  const withImage = pages.filter((p) => p.src).map((p) => p.index)
  const canFlip = withImage.length >= 2
  const page = pages[current - 1] ?? pages[0]
  const pageLabel = labels.page.replace('{n}', String(current)).replace('{total}', String(pages.length))

  function step(delta: number) {
    const pos = withImage.indexOf(current)
    const nextPos = (pos + delta + withImage.length) % withImage.length
    setCurrent(withImage[nextPos])
  }

  const open = () => dialogRef.current?.showModal()
  const close = () => dialogRef.current?.close()
  // A click on the dialog box itself (not its content) is a click on the backdrop.
  const onDialogClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) close()
  }

  const sheet = (
    <span className={`catalog-preview__sheet catalog-preview__sheet--${orientation}`}>
      {page.src ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary external thumbnail URL; next/image remotePatterns not configured for the documents CDN
        <img
          src={page.src}
          alt={alt}
          width={page.width ?? undefined}
          height={page.height ?? undefined}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="catalog-preview__img"
        />
      ) : (
        <span className="catalog-preview__placeholder" aria-hidden="true">{categoryGlyph(category)}</span>
      )}
    </span>
  )

  const arrows = canFlip && (
    <>
      <button type="button" className="catalog-preview__icon catalog-preview__icon--prev" aria-label={labels.prev} onClick={() => step(-1)}>‹</button>
      <button type="button" className="catalog-preview__icon catalog-preview__icon--next" aria-label={labels.next} onClick={() => step(1)}>›</button>
    </>
  )

  return (
    <section className="catalog-preview" aria-label={labels.region}>
      <div className="catalog-preview__stage">
        <button type="button" className="catalog-preview__open" aria-label={labels.fullscreen} onClick={open}>
          {sheet}
        </button>
        <button type="button" className="catalog-preview__icon catalog-preview__icon--expand" aria-label={labels.fullscreen} onClick={open}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </button>
        {arrows}
        {canFlip && <span className="catalog-preview__counter">{pageLabel}</span>}
      </div>

      {pages.length > 1 && (
        <div className="catalog-preview__strip" role="group" aria-label={labels.strip}>
          {pages.map((p) =>
            p.smallSrc ? (
              <button
                key={p.index}
                type="button"
                className="catalog-preview__thumb"
                aria-pressed={p.index === current}
                aria-label={labels.page.replace('{n}', String(p.index)).replace('{total}', String(pages.length))}
                onClick={() => setCurrent(p.index)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
                <img src={p.smallSrc} alt="" loading="lazy" decoding="async" />
                <span className="catalog-preview__thumb-n" aria-hidden="true">{p.index}</span>
              </button>
            ) : (
              <span key={p.index} className="catalog-preview__thumb catalog-preview__thumb--empty" aria-hidden="true">
                <span className="catalog-preview__thumb-n">{p.index}</span>
              </span>
            ),
          )}
        </div>
      )}

      <dialog ref={dialogRef} className="catalog-preview__dialog" aria-label={alt} onClick={onDialogClick}>
        <div className="catalog-preview__dialog-body">
          {sheet}
          {arrows}
          {canFlip && <span className="catalog-preview__counter">{pageLabel}</span>}
          <button type="button" className="catalog-preview__icon catalog-preview__icon--close" aria-label={labels.close} onClick={close}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </dialog>
    </section>
  )
}
