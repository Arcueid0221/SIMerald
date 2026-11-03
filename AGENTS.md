# AGENTS.md

Repository guide for `simerald`.

## Overview

- **SIMerald**: A self-hosted SIM / eSIM collection card-wall website backed by Notion and forked from the Komari Emerald theme.
- **Frontend**: Vue 3 + Vite + reka-ui + Tailwind CSS v4 in `src/`. The web UI is Simplified Chinese only.
- **Backend**: Zero-dependency Node.js (`>= 22.18.0`) running TypeScript directly via native type stripping in `server/`, with no separate backend build step.
- **Shared**: `shared/` holds TypeScript types and the theme settings schema shared by both frontend and backend.
- **Documentation**: Read [`docs/design.md`](docs/design.md) and [`docs/configuration.md`](docs/configuration.md) before changing application behavior.

## Repository Structure

- `src/`: Frontend application (see [`src/AGENTS.md`](src/AGENTS.md)).
- `server/`: Backend service:
  - `index.ts`: HTTP server and API routes
  - `config.ts`: Environment variable and path configuration
  - `auth.ts`: Single-owner authentication (scrypt password, TOTP, recovery codes, sessions, rate limiting)
  - `notion.ts`: Read-only Notion API client (`2025-09-03` data sources API) and property extractors
  - `mapping.ts`: Default Notion column name mapping (`DEFAULT_MAPPING`) and custom JSON merging
  - `cards.ts`: Transforms Notion pages into `SimCard` and `SimRecord` objects, computes HMAC `opaqueId`
  - `view.ts`: Whitelist-based masking (`toPublicCard`) for unauthenticated responses
  - `sync.ts`: Daily scheduled sync, startup stale-cache check, and `cache.json` / `sync-status.json` persistence
  - `settings.ts`: Persistent site, theme, sync, and Notion connection settings
  - `logos.ts`: Serves carrier logos from `<DATA_DIR>/logos/` at `/logos/<file>`
  - `demo.ts`: Fictional dataset used when no Notion token is configured
- `shared/types.ts`: Shared API and domain types.
- `shared/settings-schema.ts`: Theme settings schema (`SETTINGS_SCHEMA`) driving both backend sanitization and the admin UI form.
- `public/assets/flags/`: Twemoji flag SVGs, served as `/assets/flags/<ISO>.svg`.
- `deploy/compose.yaml`: Example Docker Compose deployment; `Dockerfile` builds the frontend in stage 1 and runs `node server/index.ts` in stage 2.

## Commands

Run from the repository root using `npm` (lockfile: `package-lock.json`):

```bash
npm run dev:server   # Backend on :25780 (serves demo data when no Notion token is configured)
npm run dev          # Vite dev server, proxies /api to the backend
npx eslint .         # Lint frontend, backend, and shared code
npm run type-check   # vue-tsc --build across app and server tsconfigs
npm run build-only   # Build frontend production bundle into dist/
```

There is no automated test suite. Verify changes by running `npx eslint .`, `npm run type-check`, and `npm run build-only`, and by exercising the backend against demo data.

## Key Rules

- **Privacy whitelist**: Anything not explicitly copied in `server/view.ts` (`toPublicCard` and `publicRecord`) must never reach unauthenticated `/api/cards` responses. Owner-only fields are: full `number`, full `type`, `device`, `balance`, `balanceUpdatedAt`, `services`, `account`, `paymentAccounts`, `dataCheck`, `notionUrl`, and expense record `title` and `accounts`.
- **Erasable-only TypeScript in `server/` and `shared/`**: Because Node executes `.ts` files directly via type stripping, do not use TypeScript `enum`, parameter properties, namespaces, or import aliases in `server/` or `shared/`. Always include `.ts` extensions in relative imports.
- **Secret handling**: Secrets (Notion token, password hash, TOTP secret, session keys) belong only in the data directory or environment variables—never in the repository.
- **CSRF header**: All state-changing API requests require the `X-SIMerald-Request: 1` header.
- **Preserve the Emerald visual language**: Reuse existing primitives in `src/components/ui/` and OKLCH design tokens in `src/styles/main.css` rather than introducing new component libraries or ad-hoc styles.
