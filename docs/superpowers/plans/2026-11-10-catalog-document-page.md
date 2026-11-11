# Catalog Document Page Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Переделать страницу документа каталога (`/[lang]/catalog/[slug]`) по макету: каркас каталога, понятная иерархия «заголовок → описание → превью + действия», полноэкранный просмотр, адаптив с закреплённой панелью действий на телефоне, полная локализация.

**Architecture:** Страница оборачивается в существующий `CatalogShell` (ветка `feat/catalog-redesign`). `DocumentView` остаётся серверным компонентом и сам берёт строки через `getCatalogStrings(lang)` и локализованные заголовок/описание через `documentLocalizedMeta`. Интерактив — маленькие клиентские острова: `DocumentPreview` (лайтбокс на `<dialog>`), `ExpandableText`, `BackToResults`, обновлённый `ShareButton`. Чистая логика (относительная дата, подбор похожих, валидация ссылки «назад») — в `features/catalog/*.ts` под vitest.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, plain CSS рядом с компонентом, vitest 4 (`environment: 'node'`).

**API:** функции, которые ждут бэкенд, и задача на миниатюры всех листов — [2026-11-10-catalog-api-requirements.md](2026-11-10-catalog-api-requirements.md).

**Spec:** макет https://claude.ai/artifact/CTizYaQ2RP7PuSBX71KkSp — артборды «Документ — десктоп» и «Документ — мобильный» + раздел «Design decisions» ниже. Базовая ветка: `feat/catalog-redesign` (токены `--c-*`, `CatalogShell`, `CatalogCard`, `.catalog-sr-only`).

## Design decisions (из макета, зафиксированы)

- Порядок блоков: хлебные крошки + «← К результатам» → бейдж категории (глиф + локализованное имя) и «обновлён {relative}» → `h1` → описание (свёрнуто до 3 строк, кнопка «Показать полностью / Свернуть», кнопка только если описание длиннее ~200 символов) → две колонки: превью (`flex: 999 1 560px`) и правая колонка (`flex: 1 1 320px; max-width: 360px; position: sticky; top: 24px`) → «Похожие шаблоны».
- Превью: сцена высотой 640px (десктоп) / 470px (≤640px) на миллиметровке 18px, радиус 20px; внутри лист `aspect-ratio: 210/297` (portrait, `height: 88%`) или `297/210` (landscape, `width: 88%`), белый, тень `0 24px 60px rgba(15,23,42,.14)`, `object-fit: contain`. Кнопка ⤢ (44×44, правый верхний угол). Клик по листу или ⤢ → `<dialog>` на весь экран, фон `rgba(15,23,42,.88)`, кнопка ×, закрытие Esc (нативно) и кликом по фону. Без превью — миллиметровка + крупный глиф категории.
- Многостраничность: лента листов **остаётся** (при `pageCount > 1`) и переоформляется: миниатюры — мини-листы A4 (ширина 72px, радиус 6px, тень), номер листа mono под миниатюрой, активный лист — рамка 2px `--c-accent`. Источник — `buildPageStrip(doc)` (Task 1):
  - лист с картинкой — `<button aria-pressed>`, клик переключает основное превью; на превью подпись «Лист N из M» и стрелки ‹ › (только если листов с картинкой ≥ 2); полноэкранный просмотр показывает текущий лист со стрелками;
  - лист без картинки (сейчас — все, кроме первого, пока нет API-1) — не кнопка: приглушённый мини-лист с номером; у группы `role="group"` и `aria-label` «Листы документа»;
  - когда API начнёт отдавать `pageThumbnails` (API-1), лента заработает без изменений фронтенда.
- Правая колонка (белая карточка, радиус 20px, padding 22px): кнопка «Открыть в редакторе» (полная ширина, min-height 54px, оранжевый градиент, иконка карандаша) → подпись «Бесплатно · понадобится аккаунт» (только гостям) → «Поделиться» (кнопка `soft`, полная ширина) → сетка 2×2 характеристик (Формат «A4 ▯ книжная», Листов, Просмотры compact, Язык — полное название) → теги-ссылки `#tag` → «Как использовать» (3 шага).
- ≤ 900px: одна колонка; правая колонка становится обычным блоком под превью, а **группа действий** (CTA + «Поделиться») закрепляется внизу экрана: `position: fixed; bottom: 0`, фон `rgba(255,255,255,.94)` + blur, `padding-bottom: calc(12px + env(safe-area-inset-bottom))`; «Поделиться» — квадратная иконка 52×52, CTA — `flex: 1`, высота 52px. Странице добавляется нижний отступ под панель.
- «Поделиться»: `navigator.share`, иначе копирование + тост «Ссылка скопирована» (`role="status"`, `aria-live="polite"`), 2,2 с.
- «Похожие»: горизонтальная лента `CatalogCard` шириной 260px, `overflow-x: auto; scroll-snap-type: x proximity`; заголовок + ссылка «Все в теме «{category}» →». Если в категории меньше 3 документов — добрать по первому тегу.

## Global Constraints

- Перед кодом прочитать нужные гайды в `node_modules/next/dist/docs/` (требование `AGENTS.md`).
- Коммиты — только по явному разрешению пользователя; без разрешения показывать команду.
- Все строки UI — во всех 4 локалях `src/lib/i18n/locales/{en,ru,es,de}/catalog.json`; тест паритета ключей (`i18n.test.ts`) должен проходить. Шаблоны — одинарные скобки `{x}`, подстановка через `.replace`.
- Не трогаем: `generateMetadata`, JSON-LD, `revalidate = 300`, `ViewBeacon`, логику `OpenInEditorCTA` (только `className`).
- Ждёт API (см. файл требований): кнопка «Нравится» (API-2), картинки 2-го и следующих листов (API-1 — фронтенд готовится к ним в этом плане), экспорт PDF (API-4). Меню «Telegram/WhatsApp» — вне скоупа.
- Тесты — только чистые функции (vitest `node`, без DOM-библиотек, без новых зависимостей).
- Ветка: `feat/catalog-document-page` (от `feat/catalog-redesign`).

## Review Focus

1. `pageThumbnails` отсутствует, `null`, короче или длиннее `pageCount`, с пропусками → лента строится по `pageCount`, картинки берутся по `index`, первый лист без `pageThumbnails` — из `thumbnailS3Key`. Тест — Task 1 (`buildPageStrip`).
2. Документ без `description` / `tags` / `category` / `metadata` → блоки не рендерятся, ничего не падает; бейдж без категории не показывается; лист — portrait. Тесты — Task 1 (`pickRelated`, `buildPageStrip`), Task 4 (проверка в браузере на документе без описания).
3. `updatedAt` невалидный или в будущем → «обновлён» не показывается, а не «через 3 дня». Тест — Task 1 (`formatRelativeDate`).
4. Сохранённая ссылка «назад» с чужого origin, другого языка или со страницы документа → используется fallback `/${lang}/catalog`. Тест — Task 1 (`resolveBackHref`).
5. Похожие: текущий документ и дубли между выборкой по категории и по тегу исключены, не больше 6. Тест — Task 1 (`pickRelated`).
6. Мобильная панель действий не перекрывает контент и футер (нижний отступ), CTA на странице ровно один (один `OpenInEditorCTA` → один эффект редиректа). Проверка — Task 5 (DOM-проверка на 390px).

---

## File Map

| Action | Path | Ответственность |
|---|---|---|
| Create | `src/features/catalog/docPage.ts` (+ `.test.ts`) | `formatRelativeDate`, `pickRelated`, `resolveBackHref`, `LIST_URL_KEY`, `buildPageStrip` |
| Modify | `src/features/catalog/types.ts` | опциональное `CatalogDocumentMeta.pageThumbnails` (контракт API-1) |
| Modify | `src/lib/i18n/locales/{en,ru,es,de}/catalog.json` | блок `doc.*`, `share.copied` |
| Modify | `src/features/catalog/i18n.test.ts` | проверка новых строк |
| Create | `src/features/catalog/components/BackToResults.tsx` | клиент: ссылка «назад» из sessionStorage |
| Modify | `src/features/catalog/components/CatalogFilters.tsx` | запоминать URL списка в sessionStorage |
| Create | `src/features/catalog/components/ExpandableText.tsx` | клиент: свернуть/развернуть описание |
| Create | `src/features/catalog/components/DocumentPreview.tsx` / `.css` | клиент: сцена + `<dialog>` |
| Modify | `src/features/catalog/components/ShareButton.tsx` | локализация, тост, вариант-иконка |
| Modify | `src/features/catalog/components/DocumentView.tsx` / `.css` | новая разметка и адаптив |
| Modify | `src/features/catalog/components/RelatedRow.tsx` | лента + ссылка «Все в теме» |
| Modify | `src/app/[lang]/catalog/[slug]/page.tsx` | `CatalogShell`, похожие по тегу |

---

### Task 1: Чистые хелперы страницы документа

**Files:**
- Create: `src/features/catalog/docPage.ts`, `src/features/catalog/docPage.test.ts`
- Modify: `src/features/catalog/types.ts`

**Interfaces:**
- Produces:
  - `formatRelativeDate(iso: string, now: number, lang: string): string | null` — `Intl.RelativeTimeFormat(locale, { numeric: 'auto' })`; единица — минуты < 60, часы < 24, дни < 30, месяцы < 12, иначе годы; locale как в `formatCompactCount` (fallback `en`); `null` для невалидной даты или даты в будущем больше чем на 1 минуту.
  - `pickRelated(byCategory: DocumentSummary[], byTag: DocumentSummary[], currentId: string, max = 6): DocumentSummary[]` — сначала категория, потом тег, без `currentId`, без дублей по `documentId`, обрезка до `max`.
  - `LIST_URL_KEY = 'catalog:lastListUrl'`
  - в `types.ts`: `export interface PageThumbnail { index: number; s3Key: string; smallS3Key: string; width: number; height: number }` и поле `pageThumbnails?: PageThumbnail[] | null` в `CatalogDocumentMeta` (форма — из API-1).
  - `PageStripItem = { index: number; src: string | null; smallSrc: string | null; width: number | null; height: number | null }`
  - `buildPageStrip(doc: Pick<CatalogDocumentMeta, 'thumbnailS3Key' | 'metadata' | 'pageThumbnails'>): PageStripItem[]` — длина = `metadata?.pageCount ?? 1` (минимум 1); для листа `i` берётся элемент `pageThumbnails` с `index === i` (URL через `buildThumbnailUrl`); если его нет и `i === 1` — `thumbnailS3Key` в оба размера, `width/height = null`; иначе `src = smallSrc = null`; элементы с `index > pageCount` игнорируются.
  - `resolveBackHref(stored: string | null, lang: string): string` — возвращает `stored`, только если это относительный путь (начинается с `/`, не с `//`), равен `/${lang}/catalog` или начинается с `/${lang}/catalog?`, `/${lang}/catalog/category/`, `/${lang}/catalog/tag/`; иначе `/${lang}/catalog`.

- [ ] **Step 1: Написать падающие тесты** (`docPage.test.ts`):
```ts
const NOW = Date.parse('2026-11-10T12:00:00Z')
expect(formatRelativeDate('2026-11-07T12:00:00Z', NOW, 'ru')).toBe('3 дня назад')
expect(formatRelativeDate('2026-11-09T12:00:00Z', NOW, 'en')).toBe('yesterday')
expect(formatRelativeDate('2026-11-10T11:30:00Z', NOW, 'en')).toBe('30 minutes ago')
expect(formatRelativeDate('2025-11-01T00:00:00Z', NOW, 'en')).toBe('last year')
expect(formatRelativeDate('not-a-date', NOW, 'ru')).toBeNull()
expect(formatRelativeDate('2026-12-01T00:00:00Z', NOW, 'ru')).toBeNull()
expect(formatRelativeDate('2026-11-07T12:00:00Z', NOW, 'xx')).toBe('3 days ago')

const d = (id: string) => ({ documentId: id }) as DocumentSummary
expect(pickRelated([d('cur'), d('a'), d('b')], [d('b'), d('c')], 'cur').map(x => x.documentId)).toEqual(['a', 'b', 'c'])
expect(pickRelated(['1','2','3','4','5','6','7'].map(d), [], 'x')).toHaveLength(6)
expect(pickRelated([], [], 'x')).toEqual([])

expect(resolveBackHref('/ru/catalog?category=geometry&tags=a', 'ru')).toBe('/ru/catalog?category=geometry&tags=a')
expect(resolveBackHref('/ru/catalog/tag/triangle', 'ru')).toBe('/ru/catalog/tag/triangle')
expect(resolveBackHref('/ru/catalog', 'ru')).toBe('/ru/catalog')
expect(resolveBackHref('/en/catalog?x=1', 'ru')).toBe('/ru/catalog')
expect(resolveBackHref('//evil.com/ru/catalog', 'ru')).toBe('/ru/catalog')
expect(resolveBackHref('https://evil.com', 'ru')).toBe('/ru/catalog')
expect(resolveBackHref('/ru/catalog/page-1-abc', 'ru')).toBe('/ru/catalog')
expect(resolveBackHref(null, 'ru')).toBe('/ru/catalog')

// buildPageStrip; в тесте vi.stubEnv('NEXT_PUBLIC_DOCUMENTS_CDN_BASE_URL', 'https://cdn')
const pt = (index: number) => ({ index, s3Key: `p${index}`, smallS3Key: `s${index}`, width: 1600, height: 1131 })
const meta = (pageCount: number) => ({ orientation: 'landscape' as const, pageCount })
expect(buildPageStrip({ thumbnailS3Key: 't', metadata: meta(3), pageThumbnails: null }).map(p => p.src))
  .toEqual(['https://cdn/t', null, null])
expect(buildPageStrip({ thumbnailS3Key: 't', metadata: meta(3), pageThumbnails: [pt(1), pt(3)] }).map(p => p.smallSrc))
  .toEqual(['https://cdn/s1', null, 'https://cdn/s3'])
expect(buildPageStrip({ thumbnailS3Key: 't', metadata: meta(2), pageThumbnails: [pt(1), pt(2), pt(5)] })).toHaveLength(2)
expect(buildPageStrip({ thumbnailS3Key: null, metadata: undefined as never }))
  .toEqual([{ index: 1, src: null, smallSrc: null, width: null, height: null }])
```
Ожидаемые строки `Intl` сверить с фактическим выводом Node; при расхождении пробелов (NBSP) сравнивать с `new Intl.RelativeTimeFormat(...).format(...)`, как в `format.test.ts`.

- [ ] **Step 2: Запустить** `npx vitest run src/features/catalog/docPage.test.ts` — Expected: FAIL (модуль не найден).
- [ ] **Step 3: Реализовать функции из Interfaces.**
- [ ] **Step 4: Запустить** `npm test` — Expected: все PASS.
- [ ] **Step 5: Commit**
```bash
git add src/features/catalog/docPage.ts src/features/catalog/docPage.test.ts src/features/catalog/types.ts
git commit -m "feat(catalog): add document page helpers (relative date, related, back link)"
```

---

### Task 2: Строки i18n для страницы документа

**Files:**
- Modify: `src/lib/i18n/locales/{en,ru,es,de}/catalog.json`, `src/features/catalog/i18n.test.ts`

**Interfaces:**
- Produces: объект `doc` (EN / RU; ES, DE — перевод по смыслу):
  - `backToResults`: `"← Back to results"` / `"← К результатам"`
  - `updated`: `"updated {date}"` / `"обновлён {date}"`
  - `expand`: `"Show more"` / `"Показать полностью"`, `collapse`: `"Show less"` / `"Свернуть"`
  - `strip`: `"Document sheets"` / `"Листы документа"`, `page`: `"Sheet {n} of {total}"` / `"Лист {n} из {total}"`, `prev`: `"Previous sheet"` / `"Предыдущий лист"`, `next`: `"Next sheet"` / `"Следующий лист"`
  - `fullscreen`: `"View full screen"` / `"На весь экран"`, `closeFullscreen`: `"Close"` / `"Закрыть"`
  - `previewLabel`: `"Document preview"` / `"Просмотр документа"`
  - `freeNote`: `"Free · account required"` / `"Бесплатно · понадобится аккаунт"`
  - `format`: `"Format"` / `"Формат"`, `pages`: `"Sheets"` / `"Листов"`, `views`: `"Views"` / `"Просмотры"`, `language`: `"Language"` / `"Язык"`, `tags`: `"Tags"` / `"Теги"`
  - `portrait`: `"portrait"` / `"книжная"`, `landscape`: `"landscape"` / `"альбомная"`
  - `howTo`: `{ "title": "How to use" / "Как использовать", "step1": "Open the template in the editor — a copy is saved to your account" / "Откройте шаблон в редакторе — копия сохранится у вас", "step2": "Change the text, numbers and formulas for your lesson" / "Измените текст, числа и формулы под свой урок", "step3": "Print it or export to PDF" / "Распечатайте или экспортируйте в PDF" }`
  - `allInCategory`: `"All in “{category}” →"` / `"Все в теме «{category}» →"`
  - `relatedTitle`: `"Similar templates"` / `"Похожие шаблоны"`
  - `shareCopied` (на верхнем уровне, рядом с существующей строкой `share`): `"Link copied"` / `"Ссылка скопирована"`

- [ ] **Step 1: Падающий тест** в `i18n.test.ts`: `expect(getCatalogStrings('ru').doc.portrait).toBe('книжная')`, `expect(getCatalogStrings('ru').shareCopied).toBe('Ссылка скопирована')`, `expect(getCatalogStrings('de').doc.allInCategory).toContain('{category}')`.
- [ ] **Step 2: Run** `npx vitest run src/features/catalog/i18n.test.ts` — Expected: FAIL.
- [ ] **Step 3: Добавить ключи во все 4 файла.**
- [ ] **Step 4: Run** `npm test` и `npx tsc --noEmit` — Expected: PASS, без ошибок (паритет ключей зелёный).
- [ ] **Step 5: Commit**
```bash
git add src/lib/i18n/locales src/features/catalog/i18n.test.ts
git commit -m "feat(catalog): add document page i18n strings"
```

---

### Task 3: Клиентские острова — «назад», описание, превью, «Поделиться»

**Files:**
- Create: `src/features/catalog/components/BackToResults.tsx`
- Modify: `src/features/catalog/components/CatalogFilters.tsx`
- Create: `src/features/catalog/components/ExpandableText.tsx`
- Create: `src/features/catalog/components/DocumentPreview.tsx`, `DocumentPreview.css`
- Modify: `src/features/catalog/components/ShareButton.tsx`

**Interfaces:**
- Consumes: `LIST_URL_KEY`, `resolveBackHref` (Task 1); `categoryGlyph`, `sheetOrientation` (ветка редизайна).
- Produces:
  - `BackToResults({ lang: string, label: string })` — рендерит `<Link href={`/${lang}/catalog`}>` на сервере; после монтирования заменяет href на `resolveBackHref(sessionStorage.getItem(LIST_URL_KEY), lang)` (try/catch вокруг storage).
  - В `CatalogFilters`: `useEffect` пишет `pathname + (qs ? '?' + qs : '')` в `sessionStorage[LIST_URL_KEY]` при каждом изменении `searchParams` (try/catch). Страницы категории/тега без `CatalogFilters` не пишут — допустимо.
  - `ExpandableText({ text: string, expandLabel: string, collapseLabel: string, threshold?: number /* 200 */ })` — `<p>` с классом `is-clamped` (CSS `-webkit-line-clamp: 3`) и кнопкой `aria-expanded`; если `text.length <= threshold` — просто `<p>` без кнопки.
  - `DocumentPreview({ pages: PageStripItem[], alt: string, orientation: 'portrait' | 'landscape', category: string | null, labels: { fullscreen: string, close: string, region: string, strip: string, page: string /* "Лист {n} из {total}" */, prev: string, next: string } })` — состояние `current` (по умолчанию 1); основное превью — `pages[current - 1].src`; лента листов по Design decisions (только при `pages.length > 1`); подпись листа и стрелки ‹ › — только если листов с картинкой ≥ 2, перелистывание пропускает листы без картинки; `<section aria-label={labels.region}>` со сценой; лист — `<button>` (открывает диалог); кнопка ⤢ `aria-label={labels.fullscreen}`; `<dialog ref>` с тем же изображением (или плейсхолдером) и кнопкой × `aria-label={labels.close}`; `showModal()` / `close()`; клик по самому `<dialog>` (не по его содержимому) закрывает; изображение — `loading="eager" fetchPriority="high" decoding="async"`.
  - `ShareButton({ label: string, copiedLabel: string, className?: string, iconOnly?: boolean })` — при `iconOnly` текст скрыт в `.catalog-sr-only`; после копирования рендерит `<div className="catalog-toast" role="status" aria-live="polite">{copiedLabel}</div>` на 2200 мс; таймер очищается при размонтировании.

- [ ] **Step 1: Прочитать** `node_modules/next/dist/docs/` про `next/link` и клиентские компоненты (изменения API в этой версии).
- [ ] **Step 2: Реализовать `BackToResults` и запись URL в `CatalogFilters`.**
- [ ] **Step 3: Реализовать `ExpandableText`.**
- [ ] **Step 4: Реализовать `DocumentPreview` + CSS по Design decisions** (лента листов с двумя видами ячеек — кнопка с картинкой и приглушённый мини-лист с номером; миллиметровка 18px, лист по ориентации, плейсхолдер с глифом, стили диалога: `::backdrop` с `rgba(15,23,42,.88)`, лист `height: 92vh` / `width: 92vw` для landscape, кнопка × 44×44 в правом верхнем углу).
- [ ] **Step 5: Обновить `ShareButton`** (+ стили `.catalog-toast` в `DocumentPreview.css`: fixed, снизу по центру, тёмный фон, `z-index` выше мобильной панели; на ≤900px `bottom: calc(96px + env(safe-area-inset-bottom))`).
- [ ] **Step 6: Проверка:** `npx tsc --noEmit`, `npm run lint`, `npm test` — без ошибок.
- [ ] **Step 7: Commit**
```bash
git add src/features/catalog/components/BackToResults.tsx src/features/catalog/components/CatalogFilters.tsx src/features/catalog/components/ExpandableText.tsx src/features/catalog/components/DocumentPreview.* src/features/catalog/components/ShareButton.tsx
git commit -m "feat(catalog): add document page client islands (preview lightbox, back link, share toast)"
```

---

### Task 4: `DocumentView` — новая разметка

**Files:**
- Modify: `src/features/catalog/components/DocumentView.tsx`, `DocumentView.css`
- Modify: `src/features/catalog/components/RelatedRow.tsx`

**Interfaces:**
- Consumes: Task 1–3; `getCatalogStrings`, `getCategoryLabel`, `documentLocalizedMeta`, `categoryGlyph`, `sheetOrientation`, `formatCompactCount`, `LANGUAGES` (полное название языка), `OpenInEditorCTA` (`className="catalog-doc__cta"`).
- Produces:
  - `DocumentView({ doc: CatalogDocumentMeta, lang: string, related: DocumentSummary[] })` — проп `strings` удаляется, строки берутся внутри.
  - `RelatedRow({ documents, lang, label, moreHref?: string, moreLabel?: string })` — заголовок + опциональная ссылка, лента `.catalog-related__row` (flex, `overflow-x: auto`, карточки `flex: 0 0 260px`).

- [ ] **Step 1: Разметка по Design decisions.** Обязательные детали:
  - `h1` и описание из `documentLocalizedMeta(doc, lang)` (не `doc.title` / `doc.description`); описание — `ExpandableText`, только если оно есть и отличается от заголовка (`documentLocalizedMeta` подставляет title вместо пустого описания).
  - бейдж категории — ссылка на `/${lang}/catalog/category/${doc.category}` с глифом и `getCategoryLabel`; «обновлён …» — только если `formatRelativeDate` вернул строку (`now = Date.now()` на сервере; ISR 300 с — точности достаточно).
  - превью — `DocumentPreview` с `pages={buildPageStrip(doc)}` и `orientation={sheetOrientation(doc.metadata)}`;
  - правая колонка: блок `.catalog-doc__actions` (CTA + `ShareButton`) — единственный `OpenInEditorCTA` на странице; подпись `freeNote` под CTA;
  - характеристики: `<dl>` 2×2 — Формат `A4 ▯ {portrait}` / `A4 ▭ {landscape}`, Листов `metadata.pageCount` (строка не выводится, если нет `metadata`), Просмотры `formatCompactCount`, Язык — `LANGUAGES.find(...)?.label ?? doc.language`;
  - теги — список ссылок `/${lang}/catalog/tag/${encodeURIComponent(tag)}`, блок не рендерится при пустом списке;
  - «Как использовать» — `<ol>` из трёх шагов с номерами в кружках;
  - `RelatedRow` с `label={doc.relatedTitle}`, `moreHref` на категорию и `moreLabel={doc.allInCategory.replace('{category}', label)}` (без категории — без ссылки).
- [ ] **Step 2: CSS.** Удалить старые правила ленты страниц (`.catalog-doc__strip*`) и шахматного плейсхолдера; новые классы на токенах `--c-*` с fallback. Стили CTA: полная ширина, `min-height: 54px`, оранжевый градиент, `font-weight: 800`, тень.
- [ ] **Step 3: Адаптив.** `@media (max-width: 900px)`: колонки в одну; `.catalog-doc__actions` → `position: fixed; left: 0; right: 0; bottom: 0; z-index: 20` (фон, blur, верхняя граница, safe-area), CTA `flex: 1; min-height: 52px`, `ShareButton iconOnly`-вид через CSS (текст скрыт классом при этой ширине) 52×52; у корня страницы `padding-bottom: calc(96px + env(safe-area-inset-bottom))`; подпись `freeNote` скрыта. `@media (max-width: 640px)`: сцена 470px, заголовок `26px`.
- [ ] **Step 4: Проверка:** `npx tsc --noEmit`, `npm run lint`, `npm test` — без ошибок.
- [ ] **Step 5: Commit**
```bash
git add src/features/catalog/components/DocumentView.* src/features/catalog/components/RelatedRow.tsx
git commit -m "feat(catalog): redesign document view layout"
```

---

### Task 5: Роут страницы документа + проверка в браузере

**Files:**
- Modify: `src/app/[lang]/catalog/[slug]/page.tsx`

**Interfaces:**
- Consumes: `CatalogShell` (`lang: LanguageCode`, `pathSuffix`), `pickRelated` (Task 1), `DocumentView` (Task 4).

- [ ] **Step 1: Похожие:** запрос по категории `limit: 7`; если после исключения текущего меньше 3 и у документа есть теги — второй запрос `listPublicDocuments({ tags: [doc.tags[0]], limit: 7 })`; итог — `pickRelated(byCategory, byTag, doc.documentId)`.
- [ ] **Step 2: Обернуть в `CatalogShell`** с `pathSuffix={`/catalog/${slug}`}`; над `DocumentView` — видимые хлебные крошки `<nav aria-label="Breadcrumb">` (Главная / Каталог / категория, если есть / название) — стили уже есть в `CatalogShell.css`; рядом `BackToResults`. JSON-LD и метаданные — без изменений.
- [ ] **Step 3: Проверка в браузере** (`npm run dev`, документ из `/ru/catalog`):
  - 1440px: шапка, крошки, бейдж, H1, описание выше превью; CTA оранжевая и первая в правой колонке; на странице нет английских строк (`document.body.innerText` не содержит `Orientation|Pages|Views|Likes|Copied`);
  - многостраничный документ: лента видна, первый лист активен, остальные — приглушённые мини-листы с номерами (Tab на них не останавливается); стрелок нет, пока картинка одна;
  - клик по листу открывает `<dialog>`, Esc и клик по фону закрывают, фокус возвращается на лист;
  - «Поделиться» без `navigator.share` показывает тост;
  - «← К результатам» после перехода из `/ru/catalog?category=geometry` ведёт туда же;
  - 390px (через iframe того же origin или ресайз окна): `scrollWidth <= innerWidth`, панель действий закреплена внизу, `document.querySelectorAll('.catalog-doc__cta').length === 1`, последний элемент футера не перекрыт панелью;
  - документ без описания и тегов: блоки отсутствуют, ошибок в консоли нет.
- [ ] **Step 4: Финал:** `npm test`, `npm run lint`, `npm run build` — без ошибок.
- [ ] **Step 5: Commit**
```bash
git add "src/app/[lang]/catalog/[slug]/page.tsx"
git commit -m "feat(catalog): wrap document page in catalog shell with breadcrumbs and related fallback"
```
