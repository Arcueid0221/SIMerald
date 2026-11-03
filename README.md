<div align="center">

# SIMerald

**Turn a SIM / eSIM collection kept in Notion into a public card-wall website.**

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/screenshot-dark.webp">
  <img src="docs/screenshot-light.webp" alt="SIMerald home page (demo data)" width="100%">
</picture>

[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE) [![LINUX DO](https://img.shields.io/badge/LINUX%20DO-community-blue)](https://linux.do)

English | [简体中文](README.zh-CN.md)

</div>

SIMerald is a self-hosted web application that displays a personal SIM and eSIM collection synced from Notion. It is a fork of the [Komari Emerald](https://github.com/Tokinx/komari-theme-emerald) theme, adapting its globe, summary cards, card wall, and dark mode from VPS monitoring to SIM card validity tracking, keep-alive costs, and renewal history. The web interface is in Simplified Chinese only (there is no i18n).

## Features

- **Three card styles**: Namecard (`namecard`), Dial (`dial`), and Bar (`bar`). Visitors can switch styles in the top-right corner, and the default style is configurable in the admin panel.
- **Validity ring**: Colored by the remaining percentage of the current cycle, comparing each card against its own renewal cycle.
- **Interactive globe and summary metrics**: Plots cards by country on an interactive 3D globe or dotted map, alongside summary cards for active numbers, covered countries, renewals due within 30 days, next renewal, total spend, and remaining value.
- **Server-side privacy masking**: Visitors see only the last 4 digits of each phone number. Sensitive fields (full numbers, exact card types, devices, balances, bound services, management accounts, payment accounts, data check notes, Notion URLs, and record titles) are stripped on the backend before responses leave the server.
- **Read-only Notion sync**: Syncs once a day on a configurable schedule and supports manual sync on demand. SIMerald only reads from Notion and never modifies your databases.
- **Built-in admin panel**: A single owner account signs in with a password (scrypt) and TOTP two-factor authentication, with web-based configuration for theme settings, announcements, sync schedule, and Notion field mapping.

## Deployment

Clone the repository and start the container with Docker Compose:

```bash
git clone https://github.com/BurningSky0306/SIMerald.git
cd SIMerald/deploy
mkdir -p data && sudo chown 1000:1000 data
docker compose up -d --build
```

By default, `deploy/compose.yaml` binds the service to `127.0.0.1:25780` and runs inside the container as UID `1000` with `/data` mounted from `./data`. Expose it over HTTPS using a reverse proxy (such as Caddy or Nginx) or Cloudflare Tunnel.

Set `TRUST_PROXY` in `deploy/compose.yaml` (`cloudflare`, `xff`, or `none`) to match your reverse proxy setup so IP-based login rate limiting sees the real client IP. See [`docs/configuration.md`](docs/configuration.md) for environment variable and proxy configuration details.

> The data directory stores the password hash, TOTP secret, Notion token, settings, and cached card data. Back it up regularly and never commit it to Git.

## First-Time Setup

1. Retrieve the one-time setup key from the container log (`docker logs simerald`) or from `data/setup-key.txt`.
2. Open `https://sim.example.com/admin` in your browser.
3. Enter the setup key, set the owner password, bind a TOTP authenticator app, and save the generated one-time recovery codes.
4. Until a Notion token is configured, SIMerald runs in demo mode and displays built-in sample data.

## Connecting Notion

SIMerald reads from two required Notion databases and one optional database:

- **SIM Cards** (required): One row per SIM or eSIM card.
- **Expense Records** (required): One row per initial purchase, renewal, or top-up, linked to the SIM Cards database via a relation property.
- **Payment Accounts** (optional): Linked from SIM Cards and Expense Records to display payment account names when signed in.

To connect your workspace:

1. Create an internal integration at [Notion Integrations](https://www.notion.so/profile/integrations) with **Read content** permission only.
2. Open each database page in Notion, click the `•••` menu, select **Connections**, and grant access to your integration.
3. In the `/admin` panel under the Notion connection tab, enter the integration token and the database IDs or page URLs, then save to trigger an immediate sync. You can also supply `NOTION_TOKEN`, `NOTION_CARDS_DB`, `NOTION_RECORDS_DB`, and `NOTION_ACCOUNTS_DB` via environment variables.

If your database column names differ from the defaults in [`server/mapping.ts`](server/mapping.ts), customize the JSON mapping in the admin panel. For the complete list of fields, formulas, and calculation rules, see [`docs/configuration.md`](docs/configuration.md).

## Carrier Logos

Place carrier logo images in the `logos/` subdirectory inside the data directory (for example, `data/logos/Harbour Mobile.png`).

- Supported formats: `.png`, `.webp`, `.jpg`, `.jpeg`, `.svg`.
- File names are matched against the carrier name with case, spaces, punctuation, and symbols ignored (for example, `Harbour Mobile.png` and `harbour-mobile.webp` both match `Harbour Mobile`).
- Cards without a matching image display the carrier's initial.
- Directory listings are cached for one minute; replaced files take effect automatically with cache-busting query strings.

## Development

Requires Node.js `>= 22.18.0`. The backend runs TypeScript directly via Node's built-in type stripping without a separate build step or runtime dependencies.

```bash
npm install
npm run dev:server   # Backend on :25780 (uses demo data when no Notion token is set)
npm run dev          # Vite dev server, proxies /api to the backend
```

Before committing changes, run the linter, type checker, and production build:

```bash
npx eslint .
npm run type-check
npm run build-only
```

For codebase architecture and conventions, see [`AGENTS.md`](AGENTS.md), [`src/AGENTS.md`](src/AGENTS.md), and [`docs/design.md`](docs/design.md).

## Credits

- UI derived from [Komari Emerald](https://github.com/Tokinx/komari-theme-emerald) (MIT, Tokinx), inspired by [Komari Monitor](https://github.com/komari-monitor/komari)
- Country flag graphics from [Twemoji](https://github.com/jdecked/twemoji) (CC-BY 4.0)
- Thanks to the [LINUX DO](https://linux.do) community

## Authors and License

Built by [BurningSky0306](https://github.com/BurningSky0306), **Claude Opus 5.5** and **Gemini 4 Argon**. Released under the [MIT](LICENSE) license.
