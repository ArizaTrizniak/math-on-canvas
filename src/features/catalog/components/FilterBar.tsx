'use client'

import '@/lib/i18n'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { CATEGORIES } from '../taxonomy'
import { LANGUAGES } from '@/lib/i18n/constants'
import './FilterBar.css'

interface Props {
  lang: string
}

export function FilterBar({ lang }: Props) {
  const { t } = useTranslation('catalog')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentCategory = searchParams.get('category') ?? ''
  const currentTags = searchParams.get('tags') ?? ''
  const currentLanguage = searchParams.get('language') ?? lang
  const currentSort = searchParams.get('sort') ?? 'updatedAt'

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    // Always reset pagination when a filter changes
    params.delete('cursor')
    router.push(`${pathname}?${params.toString()}`)
  }

  function handleReset() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('category')
    params.delete('tags')
    params.delete('language')
    params.delete('sort')
    params.delete('cursor')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="catalog-filter">
      {/* Category */}
      <div className="catalog-filter__control">
        <label className="catalog-filter__label" htmlFor="cf-category">
          {t('filters.category')}
        </label>
        <select
          id="cf-category"
          className="catalog-filter__select"
          value={currentCategory}
          onChange={(e) => updateParam('category', e.target.value)}
        >
          <option value="">{t('filters.allCategories')}</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Tags */}
      <div className="catalog-filter__control">
        <label className="catalog-filter__label" htmlFor="cf-tags">
          {t('filters.tags')}
        </label>
        <input
          id="cf-tags"
          type="text"
          className="catalog-filter__input"
          value={currentTags}
          placeholder="e.g. triangle, area"
          onChange={(e) => updateParam('tags', e.target.value)}
        />
      </div>

      {/* Language */}
      <div className="catalog-filter__control">
        <label className="catalog-filter__label" htmlFor="cf-language">
          {t('filters.language')}
        </label>
        <select
          id="cf-language"
          className="catalog-filter__select"
          value={currentLanguage}
          onChange={(e) => updateParam('language', e.target.value)}
        >
          <option value="">{t('filters.allLanguages')}</option>
          {LANGUAGES.map(({ code, label }) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Sort */}
      <div className="catalog-filter__control">
        <label className="catalog-filter__label" htmlFor="cf-sort">
          {t('filters.sort')}
        </label>
        <select
          id="cf-sort"
          className="catalog-filter__select"
          value={currentSort}
          onChange={(e) => updateParam('sort', e.target.value)}
        >
          <option value="updatedAt">{t('filters.newest')}</option>
          <option value="likesCount">{t('filters.mostLiked')}</option>
          <option value="viewsCount">{t('filters.mostViewed')}</option>
        </select>
      </div>

      {/* Reset */}
      <div className="catalog-filter__control catalog-filter__control--reset">
        <button
          type="button"
          className="catalog-filter__reset"
          onClick={handleReset}
        >
          {t('filters.reset')}
        </button>
      </div>
    </div>
  )
}
