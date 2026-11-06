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

The official Notion template provides a console page (with a renewal tracker and spending charts) along with three source databases—"📱 SIM Cards", "💰 Expense Records", and "💳 Payment Accounts"—and works on its own even without SIMerald:

- **English template**: [SIMerald · SIM / eSIM Console (Template v1)](https://blossom-elk-1de.notion.site/SIMerald-SIM-eSIM-Console-Template-v1-79581cd90a0f83d29c5a81659658c201)
- **中文模板**: [SIMerald · SIM / eSIM 总控台（模板 v1）](https://blossom-elk-1de.notion.site/SIMerald-SIM-eSIM-v1-9aa81cd90a0f83eb92dd01597a2b9cde)

Connect in 5 steps (the admin UI is currently in Simplified Chinese; English UI is planned):

1. **Duplicate a template**: Open either link above and click **"Duplicate"** (「复制」) at the top right into your Notion workspace.
2. **Create a read-only integration**: At [Notion Integrations](https://www.notion.so/profile/integrations), create an **"Internal"** integration with ONLY **"Read content"** enabled (no user information) and copy the `ntn_` token.
3. **Connect the page**: On your duplicated template page, click **"•••" → "Connections"** (「连接」) at the top right and add your integration.
4. **Auto-detect & save**: Sign in at `https://<your-domain>/admin`, paste the token in **Notion connection (「Notion 连接」)**, click **Auto-detect (「自动识别」)**, then click **Save (「保存」)**.
5. **Verify & replace samples**: Once the 3 🧪 sample cards appear on the home page, delete the 🧪 rows in Notion, add your own cards, and click **Sync now (「立即同步」)**.

See the full setup guide and FAQ in [docs/notion-setup.md](docs/notion-setup.md) and the template schema & formulas in [docs/notion-template/template.md](docs/notion-template/template.md).

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
