import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import type { LanguageCode } from '@/lib/i18n/constants'
import landingEN from '@/lib/i18n/locales/en/landing.json'
import landingRU from '@/lib/i18n/locales/ru/landing.json'
import landingES from '@/lib/i18n/locales/es/landing.json'
import landingDE from '@/lib/i18n/locales/de/landing.json'
import commonEN from '@/lib/i18n/locales/en/common.json'
import commonRU from '@/lib/i18n/locales/ru/common.json'
import commonES from '@/lib/i18n/locales/es/common.json'
import commonDE from '@/lib/i18n/locales/de/common.json'
import LanguageSwitch from '@/app/(marketing)/landing/widgets/LanguageSwitch/LandingLanguageSwitch'
import { LandingAuthSlot } from '@/app/(marketing)/landing/widgets/LandingAuthSlot/LandingAuthSlot'
import { LandingCTALink } from '@/app/(marketing)/landing/widgets/LandingCTALink/LandingCTALink'
import { getCatalogStrings } from '../i18n'
import './CatalogShell.css'

const landing = { en: landingEN, ru: landingRU, es: landingES, de: landingDE } as const
const common = { en: commonEN, ru: commonRU, es: commonES, de: commonDE } as const

interface Props {
  lang: LanguageCode
  /** Path after `/${lang}`, kept when the visitor switches language. */
  pathSuffix: string
  children: ReactNode
}

/** Page frame shared by the catalog hubs: landing-style header, graph-paper backdrop, footer. */
export function CatalogShell({ lang, pathSuffix, children }: Props) {
  const t = landing[lang]
  const tCommon = common[lang]
  const tCatalog = getCatalogStrings(lang)
  const catalogHref = `/${lang}/catalog`
  const pricingHref = `/${lang}/pricing`

  return (
    <div className="catalog-shell">
      <div className="catalog-shell__grid" aria-hidden="true" />

      <header className="catalog-shell__header catalog-shell__container">
        <div className="catalog-shell__brand-row">
          <Link href={`/${lang}`} className="catalog-shell__brand">
            <Image
              className="catalog-shell__logo"
              src="/images/logo.svg"
              alt=""
              width={40}
              height={40}
              unoptimized
              loading="eager"
            />
            <span className="catalog-shell__brand-text">
              <span className="catalog-shell__brand-title">
                {t.brand}
                <span className="catalog-shell__beta">BETA</span>
              </span>
              <span className="catalog-shell__brand-subtitle">{tCommon.brandSubtitle}</span>
            </span>
          </Link>
          <nav className="catalog-shell__nav" aria-label={t.brand}>
            <Link href={catalogHref} className="catalog-shell__nav-link" aria-current="page">
              {tCatalog.nav}
            </Link>
            <Link href={pricingHref} className="catalog-shell__nav-link">
              {t.cta.pricing}
            </Link>
          </nav>
        </div>

        <div className="catalog-shell__actions">
          <LanguageSwitch currentLang={lang} pathSuffix={pathSuffix} />
          <LandingAuthSlot signInLabel={t.cta.signIn} signOutLabel={t.cta.signOut} />
          <LandingCTALink href="/editor" className="catalog-shell__cta" location="catalog-header">
            {t.cta.ready}
          </LandingCTALink>
        </div>
      </header>

      <main className="catalog-shell__main catalog-shell__container">{children}</main>

      <footer className="catalog-shell__footer">
        <div className="catalog-shell__container catalog-shell__footer-inner">
          <span>© {t.brand}</span>
          <span className="catalog-shell__footer-links">
            <Link href={catalogHref}>{tCatalog.nav}</Link>
            <Link href={pricingHref}>{t.cta.pricing}</Link>
          </span>
        </div>
      </footer>
    </div>
  )
}
