# Catalog Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Привести страницы каталога (`/[lang]/catalog`, `/category/[category]`, `/tag/[tag]`) к визуальному языку лендинга и улучшить фильтрацию, карточки и пустое состояние по утверждённому макету.

**Architecture:** Общий серверный каркас `CatalogShell` (шапка/фон/футер) оборачивает все три hub-страницы. Чистая логика (сборка URL фильтров, разбор тегов, форматирование чисел, ориентация листа, глифы категорий) выносится в `features/catalog/*.ts` и покрывается vitest-тестами (окружение `node`, без DOM). Клиентский `CatalogFilters` держит `useTransition` и оборачивает серверную сетку, чтобы приглушать её во время навигации.

**Tech Stack:** Next.js 16 App Router (серверные компоненты + `'use client'` острова), React 19, TypeScript, plain CSS рядом с компонентом, vitest 4, react-i18next (клиент) / `getCatalogStrings` (сервер).

**Spec:** макет https://claude.ai/artifact/CTizYaQ2RP7PuSBX71KkSp (артборды «Каталог — десктоп» и «Каталог — мобильный») + раздел «Design decisions» ниже.

## Design decisions (из макета, зафиксированы)

- Палитра — токены на `.catalog-shell`: `--c-ink: #0f172a`, `--c-muted: #4c5c67`, `--c-border: rgba(18,33,44,.08)`, `--c-accent: #0a6c78`, `--c-accent-ink: #08515a`, `--c-accent-soft: #e6f3f4`, `--c-warm-from: #ffbe7a`, `--c-warm-to: #e86f1d`, `--c-warm-ink: #2c1604`, `--c-paper: #f3f6f8`.
- Шрифты: основной — тот же, что на лендинге; мелкие подписи, счётчики, теги — `'JetBrains Mono', monospace`.
- Фон страницы: градиент `#f8fafc → #f3f4f6 → #f8fafc` + сетка 36px с радиальной маской (как `.landing__grid`, opacity ниже), только в верхних ~640px.
- Контейнер: `max-width: 1280px; margin-inline: auto; padding-inline: clamp(16px, 4vw, 32px)`.
- Глифы категорий: algebra `x²`, geometry `△`, calculus `∫`, statistics `σ`, trigonometry `sin`, number-theory `ℕ`, other `∗`; «Все» — `∀`; неизвестная категория — `∗`.
- Карточка: превью 4/3 на «миллиметровке» (`--c-paper` + сетка 14px), внутри «лист» с тенью: portrait → `height: 82%; aspect-ratio: 210/297`, landscape → `width: 74%; aspect-ratio: 297/210`, `object-fit: contain`. Бейдж категории — левый верхний угол (полупрозрачный белый + blur). Бейдж языка — правый верхний, только если `doc.language !== lang`. Ховер/фокус: оверлей с CTA «Открыть в редакторе» (оранжевый градиент). Низ: теги mono `#tag`, просмотры/лайки в compact-формате, справа `A4 · N стр.`.
- Активный чип категории: фон `--c-accent`, текст белый. Высота чипов и кнопок ≥ 40px (на мобильном 44px).
- Панель фильтров `position: sticky; top: 0`, фон `rgba(248,250,252,.86)` + `backdrop-filter: blur(10px)`.
- Блок «Самые популярные» — рейтинг из 3 позиций (номер оранжевым mono), показывается только без активных фильтров и без `cursor`.

## Global Constraints

- Перед кодом прочитать нужные гайды в `node_modules/next/dist/docs/` (требование `AGENTS.md`); особенно про `useRouter`/`useSearchParams`/`useTransition` и `searchParams` как `Promise`.
- Не коммитить автоматически: в шагах «Commit» исполнитель показывает команду пользователю, пользователь запускает сам.
- Все новые строки UI — во всех 4 локалях (`en`, `ru`, `es`, `de`) в `src/lib/i18n/locales/*/catalog.json`; захардкоженного английского в разметке быть не должно.
- Тесты — только чистые функции (vitest `environment: 'node'`, DOM-библиотек нет; не добавлять зависимости).
- Полнотекстовый поиск из макета **не входит** в план: API `/catalog/documents` не поддерживает `q`. Счётчики чипов и «Найдено: N» тоже не входят — API не отдаёт totals.
- SEO не трогаем: JSON-LD, `generateMetadata`, `revalidate = 300` остаются как есть.
- Тёмная тема — вне скоупа, но все цвета через токены `--c-*`.
- Ветка: `feat/catalog-redesign`.

## Review Focus

1. Категория документа `null` или вне таксономии → бейдж показывает `getCategoryLabel` (humanized slug), глиф `∗`, ничего не падает. Тест — Task 1 (`categoryGlyph`).
2. Грязные теги в URL (`?tags= Triangle, ,triangle,area,`) → `['triangle','area']`: trim, lower-case, без пустых и дублей. Тест — Task 1 (`parseTags`).
3. Изменение фильтра сбрасывает `cursor`, но сохраняет посторонние параметры (`utm_source`) — тест Task 1 (`buildCatalogHref`).
4. Документ без `metadata` (старые записи) → ориентация `portrait`, число страниц не выводится. Тест — Task 1 (`sheetOrientation`, `formatSheet`).
5. Локаль вне `LANGUAGES` или большие числа → `formatCompactCount(1240,'ru')` = `'1,2 тыс.'`, `formatCompactCount(0,'xx')` = `'0'` (fallback `en`). Тест — Task 1.

---

## File Map

| Action | Path | Ответственность |
|---|---|---|
| Create | `src/features/catalog/filterParams.ts` (+ `.test.ts`) | разбор/сборка URL фильтров |
| Create | `src/features/catalog/format.ts` (+ `.test.ts`) | compact-числа, ориентация и подпись листа |
| Modify | `src/features/catalog/taxonomy.ts` | `CATEGORY_GLYPHS`, `categoryGlyph()` |
| Modify | `src/features/catalog/i18n.test.ts` | паритет ключей локалей |
| Modify | `src/lib/i18n/locales/{en,ru,es,de}/catalog.json` | новые строки |
| Create | `src/features/catalog/components/CatalogShell.tsx` / `.css` | шапка, фон, контейнер, футер |
| Modify | `src/app/(marketing)/landing/widgets/LanguageSwitch/LandingLanguageSwitch.tsx` | проп `pathSuffix` |
| Modify | `src/features/catalog/components/CatalogCard.tsx` / `.css` | новая карточка |
| Modify | `src/features/catalog/components/OpenInEditorCTA.tsx` | проп `className` |
| Create | `src/features/catalog/components/CatalogEmptyState.tsx` / `.css` | пустое состояние |
| Modify | `src/features/catalog/components/CatalogGrid.tsx` / `.css` | сетка + empty state |
| Create | `src/features/catalog/components/CatalogFilters.tsx` / `.css` | клиентский регион фильтров с pending |
| Delete | `src/features/catalog/components/FilterBar.tsx` / `.css` | заменён `CatalogFilters` |
| Create | `src/features/catalog/components/TopRanked.tsx` / `.css` | рейтинг «Самые популярные» |
| Create | `src/features/catalog/components/CatalogPagination.tsx` | «Дальше →» / «К началу» |
| Modify | `src/app/[lang]/catalog/page.tsx` | сборка hub-страницы |
| Modify | `src/app/[lang]/catalog/category/[category]/page.tsx`, `tag/[tag]/page.tsx` | каркас + крошки |

---

### Task 1: Чистые хелперы (URL фильтров, форматирование, глифы)

**Files:**
- Create: `src/features/catalog/filterParams.ts`, `src/features/catalog/filterParams.test.ts`
- Create: `src/features/catalog/format.ts`, `src/features/catalog/format.test.ts`
- Modify: `src/features/catalog/taxonomy.ts`

**Interfaces:**
- Produces:
  - `FILTER_KEYS = ['category','tags','language','sort'] as const`
  - `parseTags(raw: string | string[] | undefined): string[]`
  - `buildCatalogHref(pathname: string, current: URLSearchParams, patch: Partial<Record<FilterKey | 'cursor', string | null>>): string` — `null`/`''` удаляет ключ; любой патч фильтра удаляет `cursor`; без параметров возвращает `pathname` без `?`.
  - `clearFiltersHref(pathname: string, current: URLSearchParams): string` — удаляет `FILTER_KEYS` и `cursor`, остальное сохраняет.
  - `hasActiveFilters(current: URLSearchParams): boolean` — `true`, если задан хоть один из `category`, `tags`, `language` (сортировка фильтром не считается).
  - `formatCompactCount(n: number, lang: string): string` — `Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 })`, locale = `lang`, если он в `LANGUAGES`, иначе `'en'`.
  - `sheetOrientation(meta: DocumentMetadata | null | undefined): 'portrait' | 'landscape'`
  - `formatSheet(meta: DocumentMetadata | null | undefined, pagesLabel: string): string | null` — `pagesLabel` содержит `{count}`; возвращает `'A4 · ' + pagesLabel.replace('{count}', n)` или `null`, если `meta?.pageCount` нет.
  - в `taxonomy.ts`: `CATEGORY_GLYPHS: Record<Category, string>`, `ALL_GLYPH = '∀'`, `categoryGlyph(slug: string | null): string`.

- [ ] **Step 1: Написать падающие тесты**

`filterParams.test.ts`:
```ts
expect(parseTags(' Triangle, ,triangle,area,')).toEqual(['triangle', 'area'])
expect(parseTags(['a,b', 'b'])).toEqual(['a', 'b'])
expect(parseTags(undefined)).toEqual([])

const sp = new URLSearchParams('category=algebra&cursor=abc&utm_source=x')
expect(buildCatalogHref('/ru/catalog', sp, { category: 'geometry' }))
  .toBe('/ru/catalog?category=geometry&utm_source=x')
expect(buildCatalogHref('/ru/catalog', sp, { category: null }))
  .toBe('/ru/catalog?utm_source=x')
expect(buildCatalogHref('/ru/catalog', new URLSearchParams(), { cursor: 'n1' }))
  .toBe('/ru/catalog?cursor=n1')
expect(clearFiltersHref('/ru/catalog', new URLSearchParams('tags=a&sort=likesCount&utm_source=x')))
  .toBe('/ru/catalog?utm_source=x')
expect(clearFiltersHref('/ru/catalog', new URLSearchParams('language=ru'))).toBe('/ru/catalog')
expect(hasActiveFilters(new URLSearchParams('sort=likesCount'))).toBe(false)
expect(hasActiveFilters(new URLSearchParams('tags=a'))).toBe(true)
```
Порядок ключей в выводе: существующие ключи сохраняют позицию, новые — в конец (поведение `URLSearchParams.set`).

`format.test.ts`:
```ts
expect(formatCompactCount(1240, 'ru')).toBe('1,2 тыс.')   // Intl ставит NBSP — сверить фактический вывод узла и зафиксировать
expect(formatCompactCount(980, 'en')).toBe('980')
expect(formatCompactCount(0, 'xx')).toBe('0')
expect(sheetOrientation({ orientation: 'landscape', pageCount: 2 })).toBe('landscape')
expect(sheetOrientation(undefined)).toBe('portrait')
expect(formatSheet({ orientation: 'portrait', pageCount: 2 }, '{count} стр.')).toBe('A4 · 2 стр.')
expect(formatSheet(null, '{count} p.')).toBeNull()
```
В `taxonomy`-части (`format.test.ts` или новый `taxonomy.test.ts`):
```ts
for (const c of CATEGORIES) expect(CATEGORY_GLYPHS[c]).toBeTruthy()
expect(categoryGlyph('geometry')).toBe('△')
expect(categoryGlyph('linear-algebra')).toBe('∗')
expect(categoryGlyph(null)).toBe('∗')
```

- [ ] **Step 2: Запустить — убедиться, что падают**

Run: `npx vitest run src/features/catalog/filterParams.test.ts src/features/catalog/format.test.ts`
Expected: FAIL (модули/экспорты не найдены).

- [ ] **Step 3: Реализовать функции из блока Interfaces**

- [ ] **Step 4: Запустить — убедиться, что проходят**

Run: `npm test`
Expected: все тесты PASS.

- [ ] **Step 5: Commit** (показать пользователю)
```bash
git add src/features/catalog/filterParams.ts src/features/catalog/filterParams.test.ts src/features/catalog/format.ts src/features/catalog/format.test.ts src/features/catalog/taxonomy.ts
git commit -m "feat(catalog): add filter URL, formatting and category glyph helpers"
```

---

### Task 2: Строки i18n + тест паритета локалей

**Files:**
- Modify: `src/lib/i18n/locales/{en,ru,es,de}/catalog.json`
- Modify: `src/features/catalog/i18n.test.ts`

**Interfaces:**
- Produces (ключи `catalog.json`, значения EN / RU; ES и DE перевести по смыслу):
  - `hubPill`: `"{count} topics"` / `"{count} тем"` (подставляется `CATEGORIES.length`; в RU учесть, что для 7 — «тем»)
  - `topRanked`: `"Most liked"` / `"Самые популярные"`
  - `seeAll`: `"See all"` / `"Смотреть все"`
  - `filters.all`: `"All"` / `"Все"`
  - `filters.removeFilter`: `"Remove filter {label}"` / `"Убрать фильтр {label}"`
  - `filters.tagsAdd`: `"Add a tag…"` / `"Добавить тег…"`
  - `filters.resetAll`: `"Clear all"` / `"Сбросить всё"`
  - `stats.views`: `"Views"` / `"Просмотры"`, `stats.likes`: `"Likes"` / `"Лайки"`, `stats.pages`: `"{count} p."` / `"{count} стр."`
  - `emptyState.title`: `"Nothing found"` / `"Ничего не нашлось"`
  - `emptyState.body`: `"Try removing some filters or pick another topic."` / `"Попробуйте убрать часть фильтров или выбрать другую тему."`
  - `emptyState.create`: `"Create your own sheet"` / `"Создать свой лист"`
  - `pagination.next`: `"Next →"` / `"Дальше →"`, `pagination.first`: `"← Back to start"` / `"← К началу"`
  - `docLanguage`: `"Document language"` / `"Язык документа"`
  - существующий `filters.reset` переименовывать не нужно — используется в empty state.

- [ ] **Step 1: Написать падающий тест паритета** в `i18n.test.ts`: рекурсивно собрать список путей ключей `en/catalog.json` и для каждой локали из `LANGUAGES` проверить, что набор путей совпадает (`expect(keysOf(strings)).toEqual(keysOf(en))`), и что `getCatalogStrings('ru').emptyState.title === 'Ничего не нашлось'`.
- [ ] **Step 2: Run** `npx vitest run src/features/catalog/i18n.test.ts` — Expected: FAIL.
- [ ] **Step 3: Добавить ключи во все 4 файла.**
- [ ] **Step 4: Run** `npm test` — Expected: PASS; `npx tsc --noEmit` — без ошибок (тип `CatalogStrings` выводится из `en`).
- [ ] **Step 5: Commit** (показать пользователю)
```bash
git add src/lib/i18n/locales src/features/catalog/i18n.test.ts
git commit -m "feat(catalog): add redesign i18n strings with locale parity test"
```

---

### Task 3: `CatalogShell` — шапка, фон, контейнер, футер

**Files:**
- Create: `src/features/catalog/components/CatalogShell.tsx`, `CatalogShell.css`
- Modify: `src/app/(marketing)/landing/widgets/LanguageSwitch/LandingLanguageSwitch.tsx`

**Interfaces:**
- Consumes: `getCatalogStrings` (`nav`), `landing.json` (`brand`, `cta.pricing`, `cta.signIn`, `cta.signOut`, `cta.ready`), `common.json` (`brandSubtitle`) — импортом JSON, как в `LandingPage.tsx`.
- Produces: `CatalogShell({ lang: LanguageCode, pathSuffix: string, children: ReactNode }): JSX.Element` — серверный компонент. `pathSuffix` — путь после `/${lang}` (напр. `'/catalog'`, `'/catalog/category/geometry'`), передаётся в языковой переключатель.
- Produces: `LandingLanguageSwitch` получает необязательный проп `pathSuffix?: string` (по умолчанию `''`), навигация `router.push(`/${code}${pathSuffix}`)`.

- [ ] **Step 1: Добавить `pathSuffix` в `LandingLanguageSwitch`** — поведение лендинга не меняется (проп не передаётся).
- [ ] **Step 2: Реализовать `CatalogShell`**: корень `<div className="catalog-shell">` с токенами из Design decisions; декоративная сетка `aria-hidden`; `<header>` — логотип `/images/logo.svg` (как на лендинге) + `BETA` + подзаголовок, ссылка «Каталог» с `aria-current="page"`, «Тарифы», `LandingLanguageSwitch`, `LandingAuthSlot`, `LandingCTALink href="/editor" location="catalog-header"`; `<main className="catalog-shell__main">` с контейнером 1280px; простой `<footer>` со ссылками «Каталог», «Тарифы». Шапка переносит строки на узкой ширине (`flex-wrap`), горизонтального скролла на 390px нет.
- [ ] **Step 3: Проверка:** `npm run lint` и `npx tsc --noEmit` — без ошибок. (Визуальная проверка — после Task 7.)
- [ ] **Step 4: Commit** (показать пользователю)
```bash
git add src/features/catalog/components/CatalogShell.* "src/app/(marketing)/landing/widgets/LanguageSwitch/LandingLanguageSwitch.tsx"
git commit -m "feat(catalog): add shared catalog shell with landing header"
```

---

### Task 4: Новая карточка `CatalogCard`

**Files:**
- Modify: `src/features/catalog/components/CatalogCard.tsx`, `CatalogCard.css`
- Modify: `src/features/catalog/components/OpenInEditorCTA.tsx`

**Interfaces:**
- Consumes: `categoryGlyph`, `formatCompactCount`, `sheetOrientation`, `formatSheet` (Task 1); `getCategoryLabel`, `getCatalogStrings` (`stats.*`, `open`, `gateIntro`, `docLanguage`) (Task 2).
- Produces: `CatalogCard({ doc: DocumentSummary, lang: string })` — сигнатура прежняя, `CatalogGrid` менять под неё не нужно.
- Produces: `OpenInEditorCTA` получает `className?: string` (по умолчанию `'catalog-cta'`).

- [ ] **Step 1: `OpenInEditorCTA` — добавить `className`**; страница документа не меняется.
- [ ] **Step 2: Переписать разметку карточки:**
  - корень `<article className="catalog-card">` (вместо `<Link>`), `position: relative`;
  - заголовок — `<Link className="catalog-card__link">` со «stretched link» (`::after { inset: 0 }`), чтобы вся карточка оставалась кликабельной;
  - превью: `.catalog-card__thumb` (миллиметровка) → `.catalog-card__sheet--{portrait|landscape}` → `<img alt="" loading="lazy" decoding="async" style="object-fit: contain">` или плейсхолдер — крупный глиф категории на миллиметровке;
  - бейдж категории (глиф + локализованная подпись) — только при `doc.category`; бейдж языка `doc.language.toUpperCase()` с `title={docLanguage}` — только при `doc.language !== lang`;
  - оверлей `.catalog-card__veil` с `OpenInEditorCTA className="catalog-card__open"` — поверх stretched link (`z-index` выше), виден на `:hover` и `:focus-within`;
  - теги: первые 3, `#tag` mono, через ссылки на `/${lang}/catalog/tag/${tag}` (тоже над stretched link);
  - футер: просмотры/лайки с `aria-label={`${stats.views}: ${doc.viewsCount}`}` и compact-числом; справа `formatSheet(doc.metadata, stats.pages)`.
- [ ] **Step 3: CSS по Design decisions;** `:focus-visible` — кольцо `--c-accent`; анимации ховера под `@media (prefers-reduced-motion: no-preference)`.
- [ ] **Step 4: Проверка:** `npm run lint`, `npx tsc --noEmit`, `npm test` — без ошибок.
- [ ] **Step 5: Commit** (показать пользователю)
```bash
git add src/features/catalog/components/CatalogCard.* src/features/catalog/components/OpenInEditorCTA.tsx
git commit -m "feat(catalog): redesign catalog card with sheet preview and editor CTA"
```

---

### Task 5: Пустое состояние и сетка

**Files:**
- Create: `src/features/catalog/components/CatalogEmptyState.tsx`, `CatalogEmptyState.css`
- Modify: `src/features/catalog/components/CatalogGrid.tsx`, `CatalogGrid.css`

**Interfaces:**
- Produces: `CatalogEmptyState({ title: string, body: string, resetHref?: string, resetLabel: string, createLabel: string })` — кнопка-ссылка «Сбросить фильтры» показывается только при `resetHref`; «Создать свой лист» ведёт на `/editor`.
- Produces: `CatalogGrid({ documents, lang, empty }: { documents: DocumentSummary[]; lang: string; empty: ComponentProps<typeof CatalogEmptyState> })` — проп `emptyLabel` удаляется; обновить все 3 места вызова (они переписываются в Task 7–8, до этого передать `empty` с текущими строками).

- [ ] **Step 1: Реализовать `CatalogEmptyState`** — глиф `∅` mono `--c-accent`, `<h2>`, текст, кнопки; фон — миллиметровка 24px, пунктирная рамка, радиус 20px.
- [ ] **Step 2: Обновить `CatalogGrid`** — `grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 24px`; на `max-width: 480px` — 2 колонки `gap: 12px`.
- [ ] **Step 3: Проверка:** `npm run lint`, `npx tsc --noEmit` — без ошибок.
- [ ] **Step 4: Commit** (показать пользователю)
```bash
git add src/features/catalog/components/CatalogEmptyState.* src/features/catalog/components/CatalogGrid.* "src/app/[lang]/catalog"
git commit -m "feat(catalog): add rich empty state to catalog grid"
```

---

### Task 6: Регион фильтров `CatalogFilters`

**Files:**
- Create: `src/features/catalog/components/CatalogFilters.tsx`, `CatalogFilters.css`
- Delete: `src/features/catalog/components/FilterBar.tsx`, `FilterBar.css`

**Interfaces:**
- Consumes: `parseTags`, `buildCatalogHref`, `clearFiltersHref`, `hasActiveFilters`, `categoryGlyph`, `ALL_GLYPH` (Task 1); `useTranslation('catalog')` (ключи Task 2); `getCategoryLabel`, `CATEGORIES`, `LANGUAGES`.
- Produces: `CatalogFilters({ lang: string, children: ReactNode })` — `'use client'`; рендерит панель фильтров, затем `<div className="catalog-results" data-pending={isPending || undefined}>{children}</div>`.

- [ ] **Step 1: Навигация через переход:** `const [isPending, startTransition] = useTransition()`; `navigate(href) => startTransition(() => router.push(href, { scroll: false }))`. Все изменения идут через `buildCatalogHref(pathname, searchParams, patch)`.
- [ ] **Step 2: Чипы категорий** — `<button aria-pressed>` для «Все» (`ALL_GLYPH`) и каждой из `CATEGORIES` (глиф + `getCategoryLabel`); повторный клик по активному чипу снимает фильтр. На ширине < 640px ряд прокручивается горизонтально (`overflow-x: auto; scroll-snap-type: x proximity`), без переноса.
- [ ] **Step 3: Ввод тегов токенами** — текущие теги из `parseTags(searchParams.get('tags'))` показываются чипами с `×` (`aria-label` из `filters.removeFilter`); поле с `<label>` (`filters.tags`), Enter или `,` добавляет тег, Backspace в пустом поле удаляет последний; навигация только если набор тегов реально изменился (убирает лишний `router.push` при blur).
- [ ] **Step 4: Язык и сортировка** — `<select>` языка со стилем из макета; сортировка — сегментированный контрол `role="group"` из трёх `<button aria-pressed>` (`newest`/`mostLiked`/`mostViewed` → `updatedAt`/`likesCount`/`viewsCount`).
- [ ] **Step 5: Строка активных фильтров** — чипы категории/тегов/языка с `×` и «Сбросить всё» (`clearFiltersHref`); видна только при `hasActiveFilters`.
- [ ] **Step 6: CSS** — sticky-панель по Design decisions; `.catalog-results[data-pending] { opacity: .6; pointer-events: none; transition: opacity .15s }`.
- [ ] **Step 7: Удалить `FilterBar.*`**, заменить импорт в `catalog/page.tsx` на `CatalogFilters` (полная сборка страницы — Task 7).
- [ ] **Step 8: Проверка:** `npm run lint`, `npx tsc --noEmit`, `npm test` — без ошибок.
- [ ] **Step 9: Commit** (показать пользователю)
```bash
git add -A src/features/catalog/components "src/app/[lang]/catalog/page.tsx"
git commit -m "feat(catalog): replace FilterBar with chip-based CatalogFilters and pending state"
```

---

### Task 7: Сборка hub-страницы `/[lang]/catalog`

**Files:**
- Create: `src/features/catalog/components/TopRanked.tsx`, `TopRanked.css`
- Create: `src/features/catalog/components/CatalogPagination.tsx`
- Modify: `src/app/[lang]/catalog/page.tsx`

**Interfaces:**
- Consumes: `CatalogShell` (Task 3), `CatalogGrid`/`CatalogEmptyState` (Task 5), `CatalogFilters` (Task 6), `parseTags`, `buildCatalogHref`, `clearFiltersHref`, `hasActiveFilters`, `formatCompactCount` (Task 1).
- Produces: `TopRanked({ documents: DocumentSummary[], lang: string, title: string, seeAllHref: string, seeAllLabel: string })` — первые 3, ссылки на страницы документов.
- Produces: `CatalogPagination({ nextHref: string | null, firstHref: string | null, nextLabel: string, firstLabel: string })` — ничего не рендерит, если оба `null`.

- [ ] **Step 1: Данные:** теги через `parseTags(sp.tags)`; читать `cursor` и передавать в `listPublicDocuments({ ..., cursor, limit: 24 })`; популярные — `limit: 3` и запрашиваются только когда нет активных фильтров и `cursor` (иначе не фетчить). Для хелперов собрать `URLSearchParams` из `sp`.
- [ ] **Step 2: Разметка:** `<CatalogShell lang pathSuffix="/catalog">` → hero (pill с `hubPill`, `h1` `hubHeadline`, `p` `hubIntro`) → `TopRanked` (`seeAllHref` = `buildCatalogHref(..., { sort: 'likesCount' })`) → `<Suspense fallback={<div className="catalog-filters catalog-filters--placeholder" aria-hidden="true" />}>` (у плейсхолдера фиксированная высота, равная панели, чтобы не было CLS) с `<CatalogFilters lang>` вокруг `CatalogGrid` и `CatalogPagination` (`nextHref` из `mainResult.nextCursor`, `firstHref` при наличии `cursor`). `empty.resetHref` = `clearFiltersHref(...)` только при `hasActiveFilters`.
- [ ] **Step 3: JSON-LD и `generateMetadata`** оставить без изменений.
- [ ] **Step 4: Проверка в браузере:** `npm run dev`, открыть `/ru/catalog` на 1440px и 390px: шапка как на лендинге, нет горизонтального скролла, чипы меняют URL и приглушают сетку во время загрузки, `?category=other` (или фильтр без результатов) показывает пустое состояние с «Сбросить фильтры», ховер на карточке показывает CTA, Tab доходит до CTA и тегов с видимым фокусом.
- [ ] **Step 5: Commit** (показать пользователю)
```bash
git add src/features/catalog/components/TopRanked.* src/features/catalog/components/CatalogPagination.tsx "src/app/[lang]/catalog/page.tsx"
git commit -m "feat(catalog): assemble redesigned catalog hub page"
```

---

### Task 8: Страницы категории и тега

**Files:**
- Modify: `src/app/[lang]/catalog/category/[category]/page.tsx`
- Modify: `src/app/[lang]/catalog/tag/[tag]/page.tsx`
- Modify: `src/features/catalog/components/CatalogShell.css` (стили крошек)

**Interfaces:**
- Consumes: `CatalogShell`, `CatalogGrid`, `categoryGlyph`, `CATEGORIES`, `getCategoryLabel`.

- [ ] **Step 1: Обернуть обе страницы в `CatalogShell`** с `pathSuffix` `/catalog/category/${category}` и `/catalog/tag/${tag}`; существующие крошки `<nav aria-label="Breadcrumb">` оформить классом `.catalog-breadcrumbs` (mono 12px, разделитель `/`, `--c-muted`) — разметку и JSON-LD не менять.
- [ ] **Step 2: Категория:** перед `h1` — крупный глиф `categoryGlyph(category)`; под сеткой — ряд ссылок-чипов на остальные категории (`/${lang}/catalog/category/${c}`, кроме текущей).
- [ ] **Step 3: Тег:** `h1` из `tagHub.heading`, под ним ссылка «← Каталог» на `/${lang}/catalog?tags=${tag}`.
- [ ] **Step 4: `empty`** для обеих страниц — без `resetHref`, но с `createLabel`.
- [ ] **Step 5: Проверка в браузере:** `/ru/catalog/category/geometry` и `/ru/catalog/tag/<существующий тег>` на 1440 и 390px — каркас, крошки, сетка и соседние категории отображаются; переключатель языка остаётся на той же странице.
- [ ] **Step 6: Commit** (показать пользователю)
```bash
git add "src/app/[lang]/catalog/category" "src/app/[lang]/catalog/tag" src/features/catalog/components/CatalogShell.css
git commit -m "feat(catalog): apply shell and breadcrumbs to category and tag hubs"
```

---

### Task 9: Финальная проверка

- [ ] **Step 1:** `npm test` — все тесты PASS.
- [ ] **Step 2:** `npm run lint` — 0 ошибок.
- [ ] **Step 3:** `npm run build` — сборка успешна; `/[lang]/catalog/*` по-прежнему ISR (`revalidate 300`), без новых предупреждений о dynamic API.
- [ ] **Step 4:** Lighthouse (mobile) для `/ru/catalog`: Accessibility ≥ 95, CLS < 0.1. Зафиксировать числа в описании PR.
