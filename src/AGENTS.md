# Source Tree Guide (`src/`)

This document applies to `src/` only. Keep frontend changes aligned with the existing Vue 3 + Vite + reka-ui + Tailwind CSS v4 architecture. **There is no Naive UI in this project**—do not reintroduce it. For overall design and configuration details, see [`../docs/design.md`](../docs/design.md) and [`../docs/configuration.md`](../docs/configuration.md).

## Core Architecture

- `main.ts` is bootstrap only. It creates the Vue app, installs Pinia, `vue-i18n` (`@/i18n`) and the router, loads global styles, attaches `window.$message`, calls `setupIconify()`, and mounts `App.vue`. Keep feature logic out of `main.ts`.
- `App.vue` is the application shell. It owns global layout, mounts `<Toaster>` (`vue-sonner`) and `Provider`, runs startup lifecycle wiring (`initApp()` / `destroyInitManager()` from `@/utils/init`), and wraps `HomeView` in `<KeepAlive>`.
- `src/router/index.ts` defines lazy-loaded routes:
  - `/` → `@/views/HomeView.vue` (card wall)
  - `/card/:id` → `@/views/CardDetail.vue` (single card details and renewal history)
  - `/admin` → `@/views/AdminView.vue` (sign-in prompt when there is no Cloudflare Access login; otherwise "Sync notes" and theme settings)
- The router has **no navigation guards**. Access control is enforced on the backend; `AdminView.vue` shows a sign-in prompt (a full page load of `/admin`, which Access intercepts) or the settings panels based on `appStore.isLoggedIn`.

## Authoring Conventions

- Use the Composition API with `<script setup lang="ts">`.
- Use `@/` path imports for modules under `src/` instead of deep relative paths.
- Keep components strictly typed and consistent with existing store, composable, and helper patterns.

## UI Library (`src/components/ui/`)

`src/components/ui/` contains the local shadcn-vue-style primitives (`alert`, `avatar`, `back-top`, `badge`, `button`, `card-x`, `data-tooltip`, `dialog`, `empty`, `input`, `progress-thin`, `sonner`, `spinner`, `tabs`). Each component:

- Wraps a `reka-ui` primitive (or composes lower-level primitives) where applicable.
- Declares variants with `class-variance-authority` and merges classes via `cn()` from `@/lib/utils` (`clsx` + `tailwind-merge`).
- Uses Tailwind utilities backed by OKLCH CSS variables defined in `@/styles/main.css` (with `.dark` overrides via `@custom-variant dark`).

When adding or updating UI:

1. Compose existing primitives from `src/components/ui/` first.
2. If a new primitive is needed, follow the same pattern (`reka-ui` + `cva` + `cn()`) rather than adding another UI library.
3. Avoid per-component SCSS or scoped `<style>` blocks for styling that Tailwind utilities already express.

## Views and Card Components

- Views orchestrate state exposed by stores and utility modules.
- `HomeView.vue` coordinates search, continent grouping, card-style switching, scroll restoration, and navigation. Keep `defineOptions({ name: 'HomeView' })` in `HomeView.vue` so `<KeepAlive :include="['HomeView']">` in `App.vue` continues to work.
- Card wall components live in `src/components/sim-card/`:
  - `SimCardShell.vue`: SIM cut-corner card frame, tilted flag watermark, and dark-mode glow
  - `ValidityRing.vue`: Circular progress ring for remaining cycle validity
  - `CarrierLogo.vue`: Carrier image with initial-letter fallback
  - `SimInfoRows.vue`: Shared metadata rows
  - `SimCardNamecard.vue`, `SimCardDial.vue`, `SimCardBar.vue`: The three user-selectable card layouts (`namecard`, `dial`, `bar`)
  - `@/components/SimCard.vue` selects the active layout component; shared display properties are computed in `@/composables/useSimCardView`.
- `CardDetail.vue` displays a single SIM card's financial summary cards, detail sections, and `RenewalHistory`.
- `AdminView.vue` composes the administration panels in `src/components/admin/`.
- Keep heavy card and chart components lazily loaded with `defineAsyncComponent` (as done for `SimCard`, `SummaryCards`, and `RenewalHistory`).

## Internationalization (`src/i18n/`)

- `index.ts` creates the `vue-i18n` instance (Composition API, `legacy: false`) and exports `AppLocale` (`'zh-CN' | 'en'`), `setLocale()` (also sets `<html lang>`), `browserLocale()`, `translateKey()` for keys built at runtime, `translateError()` for API / sync error codes, `formatNumber()` and `compareText()` (locale-aware number formatting and sorting).
- `locales/zh-CN.ts` is the source dictionary and defines `MessageSchema`; `locales/en.ts` is typed against it, so a missing English key fails the type check. Keys used through `t()` are not type-checked against the dictionary, so check new keys by hand.
- Message syntax: `{name}` interpolates; plural forms are separated by `|` and selected with `t(key, n)` (`{n}` is the count); a literal `@ { } | $` must be written as `{'@'}` etc. `keepAlive`, `recordKinds` and `cycle` reuse the labels the card notes use in each language.
- The active language lives in `useAppStore().locale`: the visitor's choice (`localStorage` key `locale`), else the `defaultLanguage` theme setting, else the browser language. The header language button toggles it. Messages are compiled by vue-i18n's JIT compiler, which works under the `script-src 'self'` CSP.
- In components use `const { t } = useI18n()`; in plain modules (`@/utils/*`) use `i18n.global.t`. Helpers that return display text (`cardHelpers`, `cardTypeHelper`) translate at call time, so computed values re-run when the language changes.

## Stores

- Pinia stores use setup store syntax and act as the single source of truth for client state.
- `@/stores/app` owns site metadata (`publicSettings` from `/api/site`), theme-derived configuration, authentication state, layout flags, theme mode, UI language (`locale`), and persisted UI preferences.
- `@/stores/cards` owns the `SimCard[]` list from `/api/cards`, continent group derivation (continent codes from `@/utils/continentHelper`, named via `continents.<code>`), and card lookups.
- Components and views should read from stores rather than duplicating domain state.
- When reading `publicSettings.theme_settings`, follow the defensive pattern in `@/stores/app` (`typeof` checks, valid-option filtering, and fallback defaults). The schema lives in `shared/settings-schema.ts`.

## Utilities and Composables

- `@/utils/api`: HTTP client wrapper; automatically attaches the `X-SIMerald-Request: 1` CSRF header on state-changing requests, and turns error responses into `ApiError` with `code` / `params` and a message translated from `errors.<code>`.
- `@/utils/init`: Startup data loading and 10-minute background refresh timer; call `refreshData()` after a manual sync. Also reloads demo cards when the UI language changes.
- `@/utils/cardHelpers`: SIM card computations (days remaining, validity ratio and color tone, initial purchase price, annual keep-alive cost, balance coverage check, and sorting) and localized display of note-derived values (`countryName`, `keepAliveLabels`, `cycleText`, `recordKindLabel`, `billingPeriodText`, `joinList`).
- `@/utils/cardTypeHelper`: Card type icon and label helpers.
- `@/utils/financeHelper` and `@/composables/useExchangeRates`: Multi-currency conversion, monthly expense, and remaining value calculations.
- `@/utils/regionHelper`, `@/utils/geoHelper`, `@/utils/tagHelper`: Country flag, geographic coordinate, and tag helpers.
- `@/utils/message`: Toast wrapper exposed as `window.$message` backed by `vue-sonner`.
- Reuse these modules instead of reimplementing parsing, formatting, lookup, or fetch logic in components.

## Application Globals and Theming

- The only global attached to `window` is `$message`, typed in `src/types/global.d.ts`. Keep that declaration in sync if globals change.
- There is no `$dialog`, `$notification`, or `$loadingBar`.
- `Provider.vue` manages dark mode via `useDark()` from `@vueuse/core` and toggles `.dark` on `<html>`. The preference is stored in `useAppStore().themeMode` (`'auto' | 'light' | 'dark'`, persisted in `localStorage`), which `useDark()` uses as its storage ref.
- Build-time constants `__BUILD_VERSION__` and `__BUILD_GIT_HASH__` are declared in `src/types/global.d.ts` and injected by `vite.config.ts`.

## Icons

- Render all icons through `@iconify/vue` (`<Icon icon="icon-park-outline:sun" />`). Icon sets are loaded on demand from the Iconify CDN (`setupIconify()` in `@/utils/iconify` is a no-op extension point). Do not bundle full icon sets into the client.
- Use the `lucide:` prefix for Lucide icons (e.g. `lucide:x`, `lucide:minus`). Do not install `lucide-vue-next` or other icon component packages.

## Styles

- `@/styles/main.css` is the single global stylesheet. It imports `tailwindcss` and `tw-animate-css`, declares the `dark` custom variant, and defines OKLCH design tokens for light and dark modes. Do not add SCSS or UnoCSS.
- Style components with Tailwind utility classes composed via `cn()`, using scoped `<style>` blocks only when CSS features cannot be expressed cleanly with utilities.

## Validation

Validate frontend changes from the repository root with:

```bash
npx eslint .
npm run type-check
npm run build-only
```

There is no automated test suite.
