# AGENTS.md

Repository guide for `simerald`.

## Overview

- **SIMerald**: A self-hosted SIM / eSIM collection card-wall website backed by Notion and forked from the Komari Emerald theme.
- **Frontend**: Vue 3 + Vite + reka-ui + Tailwind CSS v4 in `src/`. The web UI is Simplified Chinese only.
- **Backend**: Zero-dependency Node.js (`>= 22.18.0`) running TypeScript directly via native type stripping in `server/`, with no separate backend build step.
- **Shared**: `shared/` holds TypeScript types and the theme settings schema shared by both frontend and backend.
- **Documentation**: Read [`docs/design.md`](docs/design.md) and [`docs/configuration.md`](docs/configuration.md) before changing application behavior. User-facing Notion setup guides live in [`docs/notion-setup.md`](docs/notion-setup.md) and [`docs/notion-setup.zh-CN.md`](docs/notion-setup.zh-CN.md).

## Repository Structure

- `src/`: Frontend application (see [`src/AGENTS.md`](src/AGENTS.md)), including `src/utils/links.ts` (`NOTION_SETUP_URL`) and `src/utils/financeHelper.ts` (38 currencies, including `AED`, `MOP` and `TWD`; live rates from `frankfurter.app`, falling back to `open.er-api.com`).
- `server/`: Backend service:
  - `index.ts`: HTTP server and API routes (including `POST /api/admin/notion/detect` and `PUT /api/admin/notion` with `preset`)
  - `config.ts`: Environment variable and path configuration
  - `auth.ts`: Single-owner authentication (scrypt password, TOTP, recovery codes, sessions, rate limiting)
  - `notion.ts`: Read-only Notion API client (`2025-09-03` data sources API: `resolveDataSource` returning the data source object with schema, `getDataSource`, `searchDataSources`) and property extractors
  - `mapping.ts`: Built-in Notion column presets (`PRESETS.zh` / `DEFAULT_MAPPING` and `PRESETS.en`), bilingual `statusValues` and `recordTypes` vocabularies, `resolveMapping`, `resolveRecordKind`, and custom JSON merging (`mergeMapping`)
  - `detect.ts`: Auto-detects Notion template databases and preset shared with the integration (`detectTemplates`)
  - `fieldcheck.ts`: Non-fatal schema health check (`checkFields`) comparing mapped columns of `cards` and `records` against Notion data source property schemas
  - `cards.ts`: Transforms Notion pages into `SimCard` and `SimRecord` objects (record `kind` via `resolveRecordKind` from `mapping.ts`), computes HMAC `opaqueId`
  - `view.ts`: Whitelist-based masking (`toPublicCard`, `publicRecord`) for unauthenticated responses
  - `sync.ts`: Daily scheduled sync, startup stale-cache check, `backfillRecordKinds` for older caches, `fieldIssues` reporting, and `cache.json` / `sync-status.json` persistence
  - `settings.ts`: Persistent site, theme, sync, and Notion connection settings (`notion.preset` and `notion.mapping`)
  - `logos.ts`: Serves carrier logos from `<DATA_DIR>/logos/` at `/logos/<file>`
  - `demo.ts`: Fictional dataset used when no Notion token is configured
- `shared/types.ts`: Shared API and domain types (including `RecordKind`, `FieldIssue`, `DetectMatch`).
- `shared/settings-schema.ts`: Theme settings schema (`SETTINGS_SCHEMA`) driving both backend sanitization and the admin UI form.
- `scripts/notion-template/`: Official v1 Notion template generator and validator:
  - `template.ts`: Single source of truth for the Chinese and English Notion templates (databases, columns, options, descriptions, formulas, sample rows, usage guide, 30 countries with calling codes, 25 currencies with CNY rate ranges).
  - `build.ts`: Validates the template definition against backend presets (`checkFields`), vocabularies, card-kind detection, cycle parsing, flag emoji, `financeHelper` currencies, relation symmetry, and sample options, and generates `docs/notion-template/template.md` and `docs/notion-template/template.zh-CN.md` (excluded from ESLint). Covered by `tsconfig.server.json` and ESLint Node overrides.
- `public/assets/flags/`: Twemoji flag SVGs, served as `/assets/flags/<ISO>.svg`.
- `deploy/compose.yaml`: Example Docker Compose deployment; `Dockerfile` builds the frontend in stage 1 and runs `node server/index.ts` in stage 2.

## Commands

Run from the repository root using `npm` (lockfile: `package-lock.json`):

```bash
npm run dev:server   # Backend on :25780 (serves demo data when no Notion token is configured)
npm run dev          # Vite dev server, proxies /api to the backend
npm run template     # Validate Notion template definition and regenerate docs/notion-template/*.md (--check to only check, --json zh|en to print JSON)
npx eslint .         # Lint frontend, backend, shared, and scripts code
npm run type-check   # vue-tsc --build across app and server tsconfigs (includes scripts/**/*.ts)
npm run build-only   # Build frontend production bundle into dist/
```

There is no automated unit test suite; `npm run template -- --check` validates the Notion template definitions against backend extractors and helpers. Verify changes by running `npm run template -- --check`, `npx eslint .`, `npm run type-check`, and `npm run build-only`, and by exercising the backend against demo data.

## Key Rules

- **Privacy whitelist**: Anything not explicitly copied in `server/view.ts` (`toPublicCard` and `publicRecord`) must never reach unauthenticated `/api/cards` responses. `SimRecord.kind` is public; owner-only fields are: full `number`, full `type`, `device`, `balance`, `balanceUpdatedAt`, `services`, `account`, `paymentAccounts`, `dataCheck`, `notionUrl`, and expense record `title` and `accounts`.
- **Erasable-only TypeScript in `server/`, `shared/`, and `scripts/`**: Because Node executes `.ts` files directly via type stripping, do not use TypeScript `enum`, parameter properties, namespaces, or import aliases in `server/`, `shared/`, or `scripts/`. Always include `.ts` extensions in relative imports.
- **Notion template maintenance**: Always edit `scripts/notion-template/template.ts` first and run `npm run template` to regenerate `docs/notion-template/template.md` and `template.zh-CN.md` (never hand-edit generated files). When updating the published Notion templates, apply changes to both Chinese and English templates and bump the version in the template title when columns change. In the published templates, `Total Spent CNY` (`卡消费合计 CNY`) is a rollup (sum of `Amount CNY`) and `First Purchase` (`首次购买日期`) is a rollup (earliest `Date`); formulas that read related pages (`Valid Until` / `当前有效期至` and both `⚠️ Data Check` / `⚠️ 数据检查` columns) must be pasted manually in the Notion UI when maintaining templates with MCP tools, which reject cross-relation formulas.
- **Secret handling**: Secrets (Notion token, password hash, TOTP secret, session keys) belong only in the data directory or environment variables—never in the repository.
- **CSRF header**: All state-changing API requests require the `X-SIMerald-Request: 1` header.
- **Preserve the Emerald visual language**: Reuse existing primitives in `src/components/ui/` and OKLCH design tokens in `src/styles/main.css` rather than introducing new component libraries or ad-hoc styles.
