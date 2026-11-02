# AGENTS.md

Repo guide for `simerald`.

## What this repo is

- SIMerald：SIM / eSIM 收藏展示站。数据来自站长的 Notion，界面 fork 自 Komari Emerald 主题
- Frontend: Vue 3 + Vite + reka-ui + Tailwind CSS v4 (unchanged stack from Emerald), source in `src/`
- Backend: plain Node (>= 22.18) running TypeScript directly via type stripping, source in `server/`, no build step and no runtime dependencies
- `shared/` holds types and the settings schema used by both sides
- Requirements doc: `docs/REQUIREMENTS.md` — read it before changing behaviour

## Root structure

- `src/` frontend (see `src/AGENTS.md`)
- `server/` backend: HTTP routes (`index.ts`), auth (`auth.ts`), Notion client (`notion.ts`), field mapping (`mapping.ts`), card building (`cards.ts`), public masking (`view.ts`), sync + daily scheduler (`sync.ts`), settings (`settings.ts`), demo data (`demo.ts`)
- `shared/types.ts` API types; `shared/settings-schema.ts` theme settings schema (drives backend validation and the admin form)
- `public/assets/flags/` Twemoji flag SVGs, served as `/assets/flags/<ISO>.svg`
- Carrier logos are not in the repo: they live in `<data dir>/logos/`, named after the carrier (case, spaces and punctuation ignored), served as `/logos/<file>` by `server/logos.ts`
- `deploy/compose.yaml` example deployment; `Dockerfile` builds frontend then runs `node server/index.ts`

## Commands

Run from repo root. Package manager is npm (lockfile: `package-lock.json`).

```bash
npm run dev:server   # backend on :25780 (demo data without a Notion token)
npm run dev          # Vite dev server, proxies /api to the backend
npx eslint .
npm run type-check   # vue-tsc --build: app + server tsconfigs
npm run build-only
```

There is no test suite. Verify with lint + type-check + build, and by running the backend against demo data.

## Rules that matter

- Privacy: anything not explicitly whitelisted in `server/view.ts` must never reach the public `/api/cards` response. Login-only fields: full number, device, services, account, payment accounts, data check, Notion URL, record titles and accounts
- Server code must stay erasable-only TypeScript (no enums, no parameter properties, `.ts` extensions in relative imports) because Node strips types at runtime
- Secrets (Notion token, password hash, TOTP secret) live only in the data directory or env vars, never in the repo
- State-changing API calls require the `X-SIMerald-Request: 1` header
- Keep the Emerald look: when changing UI, reuse existing classes and components from `src/components/ui/` rather than inventing new styles
