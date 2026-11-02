# Source Tree Guide

This document applies to `/src` only. Keep changes aligned with the current Vue 3 + Vite + reka-ui + Tailwind CSS v4 structure already used here. **There is no Naive UI in this project** — do not reintroduce it.

## Core architecture

- `main.ts` is bootstrap only. It creates the Vue app, installs Pinia and the router, loads global styles, sets `window.$message`, kicks off `setupIconify()`, and mounts `App.vue`. Do not move feature logic into bootstrap.
- `App.vue` is the app shell. It owns global layout, mounts `<Toaster>` (vue-sonner) and `Provider`, runs startup lifecycle wiring (`initApp()` / `destroyInitManager()` from `@/utils/init`), and `KeepAlive`s `HomeView`.
- `src/router/index.ts` defines lazy routes:
  - `/` → `@/views/HomeView.vue` (card wall)
  - `/card/:id` → `@/views/CardDetail.vue`
  - `/admin` → `@/views/AdminView.vue` (first-time setup, login with TOTP, settings panel)
- The router has **no guards**. Access control is enforced by the backend; the admin view just picks setup / login / settings from the store.

## Authoring conventions

- Use the Composition API with `<script setup lang="ts">`.
- Prefer `@/` imports for source-local modules instead of long relative paths.
- Keep files typed and repo-consistent with existing imports, computed state, and helper usage.

## UI library (`src/components/ui/`)

`src/components/ui/` is the local shadcn-vue-style component library (alert, avatar, back-top, badge, button, card-x, empty, input, progress-thin, sonner, spinner, tabs, tooltip). Each component:

- Wraps a `reka-ui` primitive (or composes lower-level primitives) when applicable.
- Declares variants with `class-variance-authority` and merges classes via `cn()` from `@/lib/utils` (which combines `clsx` + `tailwind-merge`).
- Uses Tailwind utilities; design tokens are CSS variables defined in `@/styles/main.css` (OKLCH, with `.dark` overrides via `@custom-variant dark`).

When you need a new piece of UI:

1. Compose existing primitives from `src/components/ui/` first.
2. If a primitive is missing, add it following the same pattern (reka-ui + cva + `cn()`), not by pulling in another component library.
3. Do not introduce per-component SCSS files or scoped styles for things Tailwind already covers.

## Views

- Views orchestrate data already exposed by stores and utils.
- `HomeView.vue` coordinates search, continent grouping, card-style selection, scroll restore, and route navigation.
- Home cards live in `src/components/sim-card/`: `SimCardShell` (cut-corner shell + flag watermark + dark-mode glow), `ValidityRing`, `CarrierLogo`, `SimInfoRows`, and one component per card style (`SimCardNamecard` 名片, `SimCardBadge` 徽章, `SimCardDial` 表盘, `SimCardBar` 横条). `@/components/SimCard.vue` picks the style; shared display values come from `@/composables/useSimCardView`.
- `CardDetail.vue` shows one SIM card: metric cards, info sections and `RenewalHistory`.
- `AdminView.vue` composes the panels in `src/components/admin/`.
- Keep `HomeView` named with `defineOptions({ name: 'HomeView' })` so `App.vue`'s `KeepAlive :include="['HomeView']"` keeps working.
- Heavy card and chart UI must stay lazily loaded with `defineAsyncComponent`, as already done for `SimCard`, `SummaryCards` and `RenewalHistory`.

## Stores

- Pinia stores are setup stores and are the source of truth for app state.
- `@/stores/app` owns site info (`publicSettings`, from `/api/site`), theme-derived config, login state, layout flags, theme mode, and persisted UI state.
- `@/stores/cards` owns the SIM cards from `/api/cards`, group (continent, via `@/utils/continentHelper`) derivation and lookups.
- Components and views should read from stores, not recreate parallel state for the same domain.
- When behavior depends on `publicSettings.theme_settings`, follow the existing defensive pattern in `@/stores/app`: `typeof` checks, valid-value filtering, and defaults. The settings schema lives in `shared/settings-schema.ts`.

## Utils

- `src/utils` owns transport, formatting, lookups, and startup orchestration.
- Keep API access in `@/utils/api` (it adds the CSRF header for writes).
- Keep startup and the 10-minute refresh in `@/utils/init`; call `refreshData()` after login, logout or sync.
- Keep SIM computations (days left, validity ratio and tone, purchase price, yearly keep-alive cost, balance coverage, sorting) in `@/utils/cardHelpers`, card type icons in `@/utils/cardTypeHelper`, money in `@/utils/financeHelper`, exchange rates via `@/composables/useExchangeRates`.
- Keep region and tag lookup logic in their dedicated helper modules (`regionHelper`, `geoHelper`, `tagHelper`).
- `@/utils/message` is the wrapper exposed as `window.$message`. It calls into `vue-sonner`'s `toast`.
- Views and components must reuse these helpers instead of duplicating parsing, formatting, lookup, or transport code.

## App globals

- Only one app global exists on `window`: `$message`. It is typed in `src/types/global.d.ts`. Keep that file in sync if you add/remove a global.
- There is **no** `$dialog`, `$notification`, or `$loadingBar`. Do not assume Naive-UI-style provider APIs.
- Theming: `Provider.vue` drives `useDark()` from `@vueuse/core` (storage key `vueuse-color-scheme`) and toggles `.dark` on `<html>`. Source of truth for the user-chosen mode is `useAppStore().themeMode` (`'auto' | 'light' | 'dark'`).
- Build-time constants `__BUILD_VERSION__` and `__BUILD_GIT_HASH__` are also declared in `src/types/global.d.ts` and injected by `vite.config.ts`.

## Icons

- All icons go through `@iconify/vue` (`<Icon icon="icon-park-outline:sun" />`). Sets are fetched on demand from the Iconify CDN — `@/utils/iconify`'s `setupIconify()` is a no-op kept as a future extension point. Do not preregister whole icon sets in client bundles.
- Lucide icons are available via the `lucide:` prefix (e.g. `lucide:x`, `lucide:minus`). Do **not** add `lucide-vue-next` or any other icon-as-component package — the project deliberately routes everything through Iconify so there is a single icon pipeline.

## Styles

- Single global stylesheet: `@/styles/main.css`. It imports `tailwindcss` and `tw-animate-css`, declares the `dark` custom variant, and defines OKLCH design tokens for both modes. **No SCSS, no UnoCSS.**
- Component-level styling should be Tailwind utilities composed with `cn()`, not scoped `<style>` blocks, unless there is a genuine reason (e.g. animations or selectors Tailwind cannot express cleanly).

## Validation

- Validate source-tree changes with:
  - `bun run lint`
  - `bun run build`
- There is no test suite. Do not invent one.
