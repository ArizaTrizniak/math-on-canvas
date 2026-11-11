'use client'

import '@/lib/i18n'
import { useOptimistic, useState, useTransition, type KeyboardEvent, type ReactNode } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '@/lib/i18n/constants'
import { ALL_GLYPH, CATEGORIES, categoryGlyph } from '../taxonomy'
import { getCategoryLabel } from '../i18n'
import { buildCatalogHref, clearFiltersHref, hasActiveFilters, parseTags, readFilterState, type FilterKey } from '../filterParams'
import { RememberListUrl } from './RememberListUrl'
import './CatalogFilters.css'

const SORTS = [
  { value: 'updatedAt', labelKey: 'filters.newest' },
  { value: 'likesCount', labelKey: 'filters.mostLiked' },
  { value: 'viewsCount', labelKey: 'filters.mostViewed' },
] as const

interface Props {
  lang: string
  /** Server-rendered results, dimmed while a filter navigation is pending. */
  children: ReactNode
}

export function CatalogFilters({ lang, children }: Props) {
  // Pin to the route language: the detector-driven i18n language is 'en' during SSR
  // and only syncs to the URL in an effect, which would render this panel in English.
  const { t } = useTranslation('catalog', { lng: lang })
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  // Show the new selection immediately; the URL catches up when the navigation lands.
  const [optimisticQuery, setOptimisticQuery] = useOptimistic(searchParams.toString())
  const params = new URLSearchParams(optimisticQuery)

  const { category, language, sort, tags } = readFilterState(params)

  function go(href: string) {
    startTransition(() => {
      setOptimisticQuery(href.split('?')[1] ?? '')
      router.push(href, { scroll: false })
    })
  }

  function update(patch: Partial<Record<FilterKey, string | null>>) {
    go(buildCatalogHref(pathname, params, patch))
  }

  function setTags(next: string[]) {
    update({ tags: next.length ? next.join(',') : null })
  }

  const removeLabel = (label: string) => t('filters.removeFilter').replace('{label}', label)
  const languageLabel = LANGUAGES.find((l) => l.code === language)?.label ?? language

  const active: { key: string, label: string, remove: () => void }[] = []
  if (category) active.push({ key: 'category', label: getCategoryLabel(category, lang), remove: () => update({ category: null }) })
  for (const tag of tags) active.push({ key: `tag:${tag}`, label: `#${tag}`, remove: () => setTags(tags.filter((x) => x !== tag)) })
  if (language) active.push({ key: 'language', label: languageLabel, remove: () => update({ language: null }) })

  return (
    <>
      <RememberListUrl />
      <section className="catalog-filters" aria-label={t('filters.category')}>
        <div className="catalog-filters__chips">
          <button
            type="button"
            className="catalog-filters__chip"
            aria-pressed={!category}
            onClick={() => update({ category: null })}
          >
            <span className="catalog-filters__glyph" aria-hidden="true">{ALL_GLYPH}</span>
            {t('filters.all')}
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className="catalog-filters__chip"
              aria-pressed={category === cat}
              onClick={() => update({ category: category === cat ? null : cat })}
            >
              <span className="catalog-filters__glyph" aria-hidden="true">{categoryGlyph(cat)}</span>
              {getCategoryLabel(cat, lang)}
            </button>
          ))}
        </div>

        <div className="catalog-filters__row">
          <TagInput
            tags={tags}
            label={t('filters.tags')}
            placeholder={tags.length ? t('filters.tagsAdd') : t('filters.tagsPlaceholder')}
            removeLabel={removeLabel}
            onChange={setTags}
          />

          <div className="catalog-filters__controls">
            <label className="catalog-filters__sr-only" htmlFor="cf-language">{t('filters.language')}</label>
            <select
              id="cf-language"
              className="catalog-filters__select"
              value={language}
              onChange={(e) => update({ language: e.target.value || null })}
            >
              <option value="">{t('filters.allLanguages')}</option>
              {LANGUAGES.map(({ code, label }) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>

            <div className="catalog-filters__segmented" role="group" aria-label={t('filters.sortGroup')}>
              {SORTS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={sort === option.value}
                  onClick={() => update({ sort: option.value === 'updatedAt' ? null : option.value })}
                >
                  {t(option.labelKey)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {hasActiveFilters(params) && (
          <div className="catalog-filters__active">
            {active.map((filter) => (
              <button
                key={filter.key}
                type="button"
                className="catalog-filters__active-chip"
                aria-label={removeLabel(filter.label)}
                onClick={filter.remove}
              >
                {filter.label}
                <span aria-hidden="true">×</span>
              </button>
            ))}
            <button type="button" className="catalog-filters__clear" onClick={() => go(clearFiltersHref(pathname, params))}>
              {t('filters.resetAll')}
            </button>
          </div>
        )}
      </section>

      <div className="catalog-results" data-pending={isPending ? '' : undefined} aria-busy={isPending}>
        {children}
      </div>
    </>
  )
}

interface TagInputProps {
  tags: string[]
  label: string
  placeholder: string
  removeLabel: (label: string) => string
  onChange: (tags: string[]) => void
}

/** Tags as removable tokens. Enter or comma commits the draft; Backspace on an empty draft drops the last tag. */
function TagInput({ tags, label, placeholder, removeLabel, onChange }: TagInputProps) {
  const [draft, setDraft] = useState('')

  function commit() {
    const added = parseTags(draft)
    setDraft('')
    const next = parseTags([...tags, ...added])
    if (next.length !== tags.length) onChange(next)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Backspace' && !draft && tags.length) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div className="catalog-filters__tags">
      <label className="catalog-filters__sr-only" htmlFor="cf-tags">{label}</label>
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          className="catalog-filters__token"
          aria-label={removeLabel(`#${tag}`)}
          onClick={() => onChange(tags.filter((x) => x !== tag))}
        >
          #{tag}
          <span aria-hidden="true">×</span>
        </button>
      ))}
      <input
        id="cf-tags"
        type="text"
        className="catalog-filters__tag-input"
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => { if (draft.trim()) commit() }}
      />
    </div>
  )
}
