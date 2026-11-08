# AGENTS.md

Repository guide for `simerald` (Obsidian + Cloudflare Workers adaptation).

## Overview

- **What it is**: A public card wall for a personal SIM / eSIM collection. Card data lives in an Obsidian vault (one note per card), is synced to an R2 bucket by the Remotely Save plugin, and is read by a Cloudflare Worker when the owner presses "Sync notes" in the admin page.
- **Frontend**: Vue 3 + Vite + reka-ui + Tailwind CSS v4 in `src/`, bilingual via `vue-i18n` (`src/i18n/locales/`). Built into `dist/` and served by Workers Static Assets.
- **Backend**: Cloudflare Worker in `worker/` (bindings: `ASSETS`, R2 `NOTES`, KV `STORE`; config in `wrangler.jsonc`). Only `/api/*` and `/logos/*` reach the Worker.
- **Auth**: Cloudflare Access protects `/admin` and `/api/admin`. `worker/access.ts` verifies the Access JWT (header or `CF_Authorization` cookie) against the team's public keys on every request; there is no other login.
- **Shared**: `shared/` holds types and the theme settings schema used by both sides.
- **Docs**: user-facing docs are in [`README.md`](README.md) (Chinese); design notes in [`docs/design.md`](docs/design.md).

## Repository Structure

- `worker/index.ts`: routes, CSRF header check, `AppError` → `ApiErrorBody`
- `worker/access.ts`: `adminEmail()`; `DEV_ADMIN_EMAIL` (`.dev.vars`) stands in for a login on localhost only
- `worker/bucket.ts`: folder listing with URL-decoded key matching (`listFolder`, `getFile`)
- `worker/obsidian.ts`: `parseNote()` — YAML properties (failsafe schema, all text) and the first table with a date column
- `worker/cards.ts`: `buildCard()` (note → `StoredCard`, replaces the old Notion formulas) and `withToday()` (status / next renewal for the current date, run on every read)
- `worker/sync.ts`: `runSync()`, KV keys `snapshot` and `sync-status`
- `worker/view.ts`: allowlist redaction for visitors
- `worker/settings.ts`: theme settings and the HMAC key for public card IDs (KV keys `theme`, `id-key`)
- `worker/logos.ts`, `worker/demo.ts`, `worker/vocab.ts` (status / record type / keep-alive vocabularies), `worker/errors.ts`, `worker/env.ts`
- `src/views/AdminView.vue`, `src/components/admin/SyncSection.vue`, `ThemeSection.vue`: the admin page
- `docs/obsidian-template/`: template note and Bases view to copy into the vault

## Commands

```bash
npm run dev:worker   # build frontend, then wrangler dev on http://127.0.0.1:8790 (local R2/KV in .wrangler/)
npm run dev          # Vite dev server; proxies /api and /logos to :8790
npm run check        # eslint + vue-tsc --build (app, worker, node tsconfigs) + vite build
npm run deploy       # check, then wrangler deploy
```

There is no unit test suite. After changing sync or card logic, run `npm run dev:worker`, put notes into local R2 with `npx wrangler r2 object put "esim-notes/卡片/<name>.md" --file <file> --local`, and exercise `/api/admin/sync` and `/api/cards` as owner (`.dev.vars`) and as a visitor (`npx wrangler dev --port 8791 --host sim.test`).

## Key Rules

- **Privacy allowlist**: anything not copied in `worker/view.ts` must never reach a visitor. Owner-only: full `number`, `type`, `device`, `balance`, `balanceUpdatedAt`, `services`, `account`, `paymentAccounts`, `dataCheck`, `source`, and record `title` / `accounts`.
- **Admin routes call `requireAdmin`**; do not rely on Access alone.
- **State-changing requests need `X-SIMerald-Request: 1`.**
- **UI text goes through the dictionaries** (`zh-CN.ts` is the schema, `en.ts` must match). Errors reaching the browser carry a stable `code` with `errors.<code>` in both dictionaries.
- **No secrets in the repo**: R2 keys live only in Remotely Save; `.dev.vars` is git-ignored.
- **Preserve the Emerald visual language**: reuse `src/components/ui/` and the tokens in `src/styles/main.css`.
