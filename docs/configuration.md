# Configuration Reference

This document covers Notion database setup, field presets and mappings, calculation rules, privacy visibility, admin settings, synchronization, environment variables, and data storage for SIMerald.

## Notion Databases

SIMerald queries Notion using the official API (`Notion-Version: 2025-09-03`, querying data sources via `/v1/data_sources/{id}/query`). The integration is strictly read-only and only requires **Read content** capability. Archived or trashed pages are ignored.

You can specify each database using its database ID, data source ID, or full Notion page URL; SIMerald normalizes any 32-character hex ID found in the string and resolves the underlying data source object (including its property schema) automatically. Alternatively, if you duplicate the official Chinese or English Notion template (see [`docs/notion-setup.md`](notion-setup.md) / [`docs/notion-setup.zh-CN.md`](notion-setup.zh-CN.md)), the admin panel can auto-detect the databases and preset shared with your integration.

| Database         | Required | Role                                                                                                                                       |
| ---------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| SIM Cards        | Yes      | Primary table; one page per SIM or eSIM card.                                                                                              |
| Expense Records  | Yes      | One page per initial purchase, renewal, or top-up, linked to the SIM Cards database via a relation property.                               |
| Payment Accounts | No       | Linked from SIM Cards and Expense Records to resolve payment account page titles. If omitted or unreadable, sync continues with a warning. |

### Property Type Compatibility

The Notion property extractors in `server/notion.ts` accept multiple Notion property types for each field, so columns can be plain properties, formulas, or rollups:

- **Text fields** (`propText`): `title`, `rich_text`, `select`, `status`, `phone_number`, `email`, `url`, `number`, `multi_select`, `formula` (`string`, `number`, `boolean`, `date`), or `rollup` (`number`, `date`, `array`).
- **Numeric fields** (`propNumber`): `number`, `formula` returning `number`, `rollup` returning `number`, or any text-compatible property whose string value parses as a finite number.
- **Date fields** (`propDate`): `date`, `created_time`, `formula` returning `date` or an ISO date `string` (`YYYY-MM-DD...`), or `rollup` returning `date` or an `array` of dates (uses the earliest start date).
- **List fields** (`propList`): `multi_select`, `rollup` returning an `array`, or any single text-compatible property (wrapped in a single-element array).
- **Select fields with color** (`propSelect`): `select`, `status`, or any text-compatible property (falls back to `default` color).
- **Relation fields** (`propRelation`): `relation` properties only.

### Column Presets

`server/mapping.ts` defines `PRESETS` with two built-in presets matching the official v1 Notion templates:

- `zh` (**中文模板**): Chinese column names (`DEFAULT_MAPPING = PRESETS.zh`).
- `en` (**English template**): English column names.
- `custom` (**自定义映射（JSON）**): Layers a custom JSON object on top of the Chinese preset (`PRESETS.zh`) via `resolveMapping` and `mergeMapping(input, base)`.

Settings persist both `notion.preset` (`'zh' | 'en' | 'custom'`) and `notion.mapping` (the custom JSON text, which is retained while `zh` or `en` is selected so switching back to `custom` restores it). Existing installations without a saved `preset` migrate automatically to `custom` if they had a non-empty custom mapping, or `zh` otherwise, keeping existing deployments unchanged.

### SIM Cards Database Fields (`cards`)

Default column names are defined in `server/mapping.ts` under `PRESETS.zh.cards` (`DEFAULT_MAPPING.cards`) and `PRESETS.en.cards`. Fields marked **Important** in the table drive the public card wall (flagged as `●` by the field health check):

| Mapping Key           | Default Column (`zh`)      | Default Column (`en`)     | Expected Notion Type                   | Visibility | Important | Description                                                                                                                                       |
| --------------------- | -------------------------- | ------------------------- | -------------------------------------- | ---------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`                | `卡片名称`                 | `Card Name`               | Title (falls back to any title column) | Public     | Yes       | Card title. Conventionally formatted as `Carrier · 1234` (separated by `·`, `•`, or `\|`); the first segment is extracted as the carrier name.    |
| `number`              | `号码`                     | `Number`                  | Text / Phone number                    | Masked     | Yes       | Phone number. Visitors see only `last4` (`•••• 1234`); the full `number` is returned only when signed in.                                         |
| `country`             | `号码国家`                 | `Country`                 | Select / Text / Formula                | Public     | Yes       | Country string prefixed with a regional indicator flag emoji (e.g. `🇬🇧 英国`). Split into flag emoji (`region`) and `countryName`.                |
| `type`                | `卡片类型`                 | `Card Type`               | Select / Status / Text                 | Owner only | No        | Card type label and Notion select color (`typeColor`). A coarse `typeKind` (`physical`, `embedded`, `adapter`, `virtual`) is public.              |
| `device`              | `主要使用设备`             | `Device`                  | Text / Select                          | Owner only | No        | Primary device where the card is installed.                                                                                                       |
| `keepAlive`           | `保号动作`                 | `Keep-alive Actions`      | Multi-select / Rollup / Text           | Public     | No        | Keep-alive actions required to maintain the number.                                                                                               |
| `cycle`               | `续费周期`                 | `Renewal Cycle`           | Select / Text / Formula                | Public     | Yes       | Renewal cycle label (`cycleLabel`). The first integer found in the text is parsed as `cycleDays` (non-numeric values such as `不固定` yield `0`). |
| `price`               | `续费金额`                 | `Renewal Price`           | Number / Formula / Rollup              | Public     | Yes       | Renewal price in the card's renewal currency (defaults to `0` if empty).                                                                          |
| `currency`            | `续费币种`                 | `Renewal Currency`        | Select / Text / Formula                | Public     | Yes       | Renewal currency. Extracts a 3-letter uppercase ISO currency code (e.g. `GBP`, `USD`, `HKD`); defaults to `CNY` if none is found.                 |
| `balance`             | `当前余额`                 | `Balance`                 | Number / Formula / Rollup              | Owner only | No        | Current account balance.                                                                                                                          |
| `balanceUpdatedAt`    | `余额更新日期`             | `Balance Checked`         | Date / Formula / Rollup                | Owner only | No        | Date when the balance was last verified (`YYYY-MM-DD`). Highlighted in the UI if older than 90 days.                                              |
| `expiresAt`           | `当前有效期至`             | `Valid Until`             | Date / Formula / Rollup                | Public     | Yes       | Current validity expiration date (`YYYY-MM-DD`).                                                                                                  |
| `nextRenewal`         | `下次续费日期`             | `Next Renewal`            | Date / Formula / Rollup                | Public     | No        | Next renewal date or date range (`start` and optional `end`).                                                                                     |
| `nextRenewalOverride` | `下次续费日期（手动覆盖）` | `Next Renewal Override`   | Date / Formula                         | Public     | No        | Manual override date or date range used when `nextRenewal` is empty.                                                                              |
| `status`              | `号码状态`                 | `Status`                  | Formula / Status / Select / Text       | Public     | Yes       | Card status text matched against `statusValues`.                                                                                                  |
| `cancelledAt`         | `停用日期`                 | `Cancelled On`            | Date / Formula                         | Public     | Yes       | Deactivation / cancellation date (`YYYY-MM-DD`).                                                                                                  |
| `firstPurchaseAt`     | `首次购买日期`             | `First Purchase`          | Date / Formula / Rollup                | Public     | No        | Initial purchase date (`YYYY-MM-DD`; rollup of earliest record `Date` in the official template). Falls back to the earliest dated expense record. |
| `totalSpentCNY`       | `卡消费合计 CNY`           | `Total Spent CNY`         | Formula / Rollup / Number              | Public     | No        | Total historical spend in CNY (rollup sum of `Amount CNY` in the official template). Falls back to summing `amountCNY` across the card's records. |
| `urgency`             | `续费紧急度`               | `Urgency`                 | Formula / Select / Text                | Public     | No        | Urgency text from Notion (included in the public card payload, not directly rendered as a standalone widget).                                     |
| `services`            | `绑定的服务`               | `Linked Services`         | Multi-select / Rollup / Text           | Owner only | No        | Bound online services or accounts (displayed as tags when signed in).                                                                             |
| `account`             | `管理账号`                 | `Account Login`           | Text / Email                           | Owner only | No        | Carrier management login or account identifier.                                                                                                   |
| `paymentAccounts`     | `默认扣款账户`             | `Default Payment Account` | Relation (to Payment Accounts DB)      | Owner only | No        | Relation IDs resolved to titles from the Payment Accounts database.                                                                               |
| `dataCheck`           | `⚠️ 数据检查`              | `⚠️ Data Check`           | Formula / Text                         | Owner only | No        | Data validation warning formula or note from Notion.                                                                                              |

### Expense Records Database Fields (`records`)

Default column names are defined in `server/mapping.ts` under `PRESETS.zh.records` (`DEFAULT_MAPPING.records`) and `PRESETS.en.records`:

| Mapping Key | Default Column (`zh`) | Default Column (`en`) | Expected Notion Type               | Visibility | Important | Description                                                                                       |
| ----------- | --------------------- | --------------------- | ---------------------------------- | ---------- | --------- | ------------------------------------------------------------------------------------------------- |
| `title`     | `记录`                | `Record`              | Title (falls back to title column) | Owner only | No        | Record title. Stripped from public API responses.                                                 |
| `card`      | `SIM 卡`              | `SIM Card`            | Relation (to SIM Cards DB)         | Internal   | Yes       | Links the expense record to a SIM card (uses the first linked page ID).                           |
| `type`      | `消费类型`            | `Type`                | Select / Text                      | Public     | Yes       | Expense type label (e.g. initial purchase, renewal, top-up). Also resolved to `kind`.             |
| `date`      | `消费日期`            | `Date`                | Date / Formula                     | Public     | Yes       | Transaction date (`YYYY-MM-DD`).                                                                  |
| `amount`    | `支付金额`            | `Amount`              | Number / Formula                   | Public     | Yes       | Amount paid in the transaction currency.                                                          |
| `currency`  | `货币`                | `Currency`            | Select / Text                      | Public     | Yes       | Transaction currency (extracts 3-letter ISO code, defaults to `CNY`).                             |
| `rate`      | `当时汇率`            | `Rate to CNY`         | Number / Formula                   | Public     | No        | Historical exchange rate to CNY at the time of transaction.                                       |
| `amountCNY` | `等额 CNY`            | `Amount CNY`          | Formula / Number                   | Public     | Yes       | Transaction amount converted to CNY.                                                              |
| `extendsTo` | `本次有效期延至`      | `Extends To`          | Date / Formula                     | Public     | Yes       | Date to which this transaction extends the card's validity (`YYYY-MM-DD`).                        |
| `accounts`  | `扣款账户`            | `Payment Account`     | Relation (to Payment Accounts DB)  | Owner only | No        | Relation IDs resolved to titles from the Payment Accounts database. Stripped for public visitors. |

### Status and Record Type Vocabularies (`statusValues` and `recordTypes`)

Both built-in presets (`zh` and `en`) accept values from either template language out of the box:

- **`statusValues`** (maps the `status` column to internal status codes):
  - `active`: `["使用中", "Active"]`
  - `expired`: `["已过期", "Expired"]`
  - `cancelled`: `["已注销", "Cancelled"]`
- **`recordTypes`** (maps the expense record `type` column to `RecordKind`):
  - `purchase`: `["首次购买/开卡", "Initial purchase"]`
  - `renewal`: `["续费/保号", "Renewal"]`
  - `topup`: `["额外充值", "Extra top-up"]`

### Customizing Field Mapping

In the `/admin` panel under the Notion connection tab, you can select `zh` (中文模板), `en` (English template), or `custom` (自定义映射（JSON）). When `custom` is selected, `mergeMapping(input, base)` layers your JSON on top of `PRESETS.zh` (`DEFAULT_MAPPING`), overriding any column names, `statusValues`, or `recordTypes` while ignoring unknown keys or invalid types:

```json
{
  "cards": {
    "name": "Name",
    "number": "Phone Number"
  },
  "records": {
    "card": "SIM Card"
  },
  "statusValues": {
    "active": ["Active", "使用中"],
    "expired": ["Expired", "已过期"],
    "cancelled": ["Cancelled", "已注销"]
  },
  "recordTypes": {
    "purchase": ["Initial purchase", "首次购买/开卡"],
    "renewal": ["Renewal", "续费/保号"],
    "topup": ["Extra top-up", "额外充值"]
  }
}
```

## Derived Values and Calculation Rules

- **Opaque Card and Record IDs**: Notion page UUIDs are never exposed. `opaqueId()` computes `HMAC-SHA256(idKey, notionPageId)` using a random per-instance secret (`idKey`) and takes the first 16 hex characters. A card keeps a stable ID across syncs, but its Notion page ID cannot be reversed.
- **Carrier and Last 4 Digits**: `name` is split on `·`, `•`, or `|`. The first part becomes `carrier`. `last4` is taken from the last 4 digits of `number`; if `number` has fewer than 4 digits, it falls back to the digits in the second part of `name`. `numberMasked` is formatted as `•••• 1234` (or `••••` if no digits exist).
- **Card Kind (`typeKind`)**: Inferred from `type` (case-insensitive):
  - Contains `虚拟`, `virtual`, or `app` → `virtual`
  - Contains `实体` or `physical` → `physical`
  - Contains `卡托`, `adapter`, `estk`, or `euicc` → `adapter`
  - Contains `esim` → `embedded`
  - Otherwise → `physical`
- **Status Resolution**: If the `status` property matches a string in `statusValues.cancelled`, `statusValues.expired`, or `statusValues.active`, that status is used. Otherwise, SIMerald falls back to: `cancelled` if `cancelledAt` is set; `expired` if `expiresAt` is earlier than today (`YYYY-MM-DD`); `active` otherwise.
- **Record Kind (`SimRecord.kind`)**: Resolved on the backend by `resolveRecordKind(type, mapping)` into `'purchase' | 'renewal' | 'topup' | 'other'` (`RecordKind`). It first checks for an exact match against `mapping.recordTypes`, then falls back to case-insensitive substring matching in either language (`首次`, `开卡`, `首购`, `purchase`, `activation`, `initial` → `purchase`; `续费`, `保号`, `renew` → `renewal`; `充值`, `top-up`, `top up`, `topup`, `recharge` → `topup`), and otherwise returns `'other'`. The frontend uses `kind` for renewal-history chart/list colors, initial purchase price on cards, and cumulative-spend breakdown (`首购` / `续费` / `其他`). Cached records written by older versions have `kind` backfilled automatically on startup (`SyncService.backfillRecordKinds`).
- **Next Renewal Date**: Resolved in order: `nextRenewal.start` → `nextRenewalOverride.start` → `expiresAt`. For `cancelled` cards, `nextRenewalAt` and `nextRenewalEnd` are forced to `null`.
- **Period Start (`periodStart`)**: Expense records for a card are sorted by `date` descending (ties broken by `extendsTo` descending). `periodStart` is the `date` of the most recent record that has both `date` and `extendsTo`.
- **Remaining Days and Validity Ring**: Calculated in the browser relative to the visitor's current date so countdowns stay accurate between daily syncs.
- **Financial Metrics and Exchange Rates**: Renewal price (`price`), currency (`currency`), and cycle (`cycleDays`) feed `src/utils/financeHelper.ts` (supporting 38 currencies, including `AED`, `MOP` and `TWD`, with built-in fallback rates; unknown codes fall back to `CNY`) to compute monthly cost, yearly keep-alive cost, and remaining value using live daily exchange rates fetched by the browser (`frankfurter.app`, plus `open.er-api.com` for currencies not covered by Frankfurter). Cards with `price = 0` are treated as free keep-alive cards ("白嫖中") and excluded from value totals. Historical spend (`totalSpentCNY`) uses the CNY amounts recorded in Notion (`卡消费合计 CNY` / `Total Spent CNY`, or the sum of record `amountCNY` values) across all cards, including cancelled ones.

## Public vs. Owner-Only Visibility

Filtering happens on the backend in `server/view.ts` (`toPublicCard` and `publicRecord`). When an unauthenticated visitor requests `/api/cards`, only whitelisted properties are returned:

| Data                                                                                                                                                               | Public Visitor | Signed-In Owner |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- | --------------- |
| `id`, `name`, `carrier`, `last4`, `numberMasked`, `region`, `countryName`, `logo`, `order`                                                                         | Yes            | Yes             |
| `typeKind`, `typeColor`, `keepAlive`, `cycleDays`, `cycleLabel`, `price`, `currency`                                                                               | Yes            | Yes             |
| `expiresAt`, `nextRenewalAt`, `nextRenewalEnd`, `periodStart`, `status`, `statusLabel`, `cancelledAt`, `firstPurchaseAt`, `totalSpentCNY`, `urgency`               | Yes            | Yes             |
| Expense record `id`, `type`, `kind`, `date`, `amount`, `currency`, `rate`, `amountCNY`, `extendsTo`                                                                | Yes            | Yes             |
| Full phone number (`number`)                                                                                                                                       | No             | Yes             |
| Full card type text (`type`) and primary device (`device`)                                                                                                         | No             | Yes             |
| Current balance (`balance`) and balance update date (`balanceUpdatedAt`)                                                                                           | No             | Yes             |
| Bound services (`services`), management account (`account`), default payment accounts (`paymentAccounts`), data check (`dataCheck`), Notion page URL (`notionUrl`) | No             | Yes             |
| Expense record title (`title`) and payment accounts (`accounts`)                                                                                                   | No             | Yes             |

## Settings Panel

Signing in at `/admin` opens the administration interface, which is organized into four areas:

### 1. Theme and Site Settings (`shared/settings-schema.ts`)

Validated on the backend and rendered dynamically in the admin form:

| Category          | Key                           | Type       | Default                        | Options / Constraints                          | Description                                                                  |
| ----------------- | ----------------------------- | ---------- | ------------------------------ | ---------------------------------------------- | ---------------------------------------------------------------------------- |
| Basic             | `sitename`                    | `string`   | `'SIMerald'`                   | Max 500 chars                                  | Site title shown in the header and browser tab.                              |
| Basic             | `defaultCardStyle`            | `select`   | `'namecard'`                   | `namecard`, `dial`, `bar`                      | Default card layout for new visitors (visitors can override in browser).     |
| Basic             | `defaultSort`                 | `select`   | `'renewal'`                    | `renewal`, `notion`, `name`, `country`         | Default card wall sort order.                                                |
| Announcement      | `alertEnabled`                | `switch`   | `false`                        | Boolean                                        | Display a custom announcement banner on the home page.                       |
| Announcement      | `alertTitle`                  | `string`   | `''`                           | Max 500 chars                                  | Announcement title.                                                          |
| Announcement      | `alertContent`                | `richtext` | `''`                           | Max 10000 chars                                | Announcement body (supports basic Markdown).                                 |
| Page              | `earthViewMode`               | `select`   | `'earth'`                      | `earth`, `earth-stop`, `maps`, `cards`, `hide` | Header display mode (rotating globe, static globe, dotted map, cards, hide). |
| Page              | `visitorInfoCardEnabled`      | `switch`   | `true`                         | Boolean                                        | Show the visitor IP / device / browser card in the header.                   |
| Page              | `hideAdminEntryWhenLoggedOut` | `switch`   | `false`                        | Boolean                                        | Hide the top-bar admin button when not signed in.                            |
| Page              | `disablePageAnimation`        | `switch`   | `false`                        | Boolean                                        | Reduce page transition animations.                                           |
| Page              | `cancelledLast`               | `switch`   | `true`                         | Boolean                                        | Push cancelled numbers (`已注销`) to the end of the list.                    |
| ICP / Filing      | `icpEnabled`                  | `switch`   | `false`                        | Boolean                                        | Show ICP filing link in the footer.                                          |
| ICP / Filing      | `icpNumber`                   | `string`   | `''`                           | Max 500 chars                                  | ICP filing number text.                                                      |
| ICP / Filing      | `icpUrl`                      | `string`   | `'https://beian.miit.gov.cn/'` | Max 500 chars                                  | URL opened when clicking the ICP filing number.                              |
| ICP / Filing      | `policeEnabled`               | `switch`   | `false`                        | Boolean                                        | Show public security filing info in the footer.                              |
| ICP / Filing      | `policeNumber`                | `string`   | `''`                           | Max 500 chars                                  | Public security filing number text.                                          |
| ICP / Filing      | `policeUrl`                   | `string`   | `''`                           | Max 500 chars                                  | URL opened when clicking the public security filing number.                  |
| Custom Background | `backgroundEnabled`           | `switch`   | `false`                        | Boolean                                        | Enable custom image or video page background.                                |
| Custom Background | `backgroundType`              | `select`   | `'image'`                      | `image`, `video`                               | Background media type.                                                       |
| Custom Background | `lightBackgroundUrl`          | `string`   | `''`                           | Max 500 chars                                  | Background media URL for light mode.                                         |
| Custom Background | `darkBackgroundUrl`           | `string`   | `''`                           | Max 500 chars                                  | Background media URL for dark mode.                                          |
| Custom Background | `backgroundBlur`              | `number`   | `0`                            | `0` to `100` (px)                              | Gaussian blur radius applied to the background.                              |
| Custom Background | `backgroundOverlay`           | `number`   | `0`                            | `-100` to `100`                                | Overlay intensity (negative lowers opacity, positive adds dark overlay).     |

### 2. Data Sync Panel

- Displays current sync state (`running`, `lastStartedAt`, `lastFinishedAt`, `lastSuccessAt`, `lastReason`, `cardCount`, `recordCount`, `nextRunAt`, `lastError`, `lastWarning`, `fieldIssues`).
- Lists any schema mismatches found by `checkFields` (`server/fieldcheck.ts`) during the latest sync (`fieldIssues: FieldIssue[]`), marking public-wall fields with `●` (`important: true`) and owner-only fields with `○` (`important: false`). Field issues do not fail the sync.
- Provides a manual sync button for immediate synchronization.
- Configures the daily sync time (`HH:mm`, default `05:00`) and IANA timezone (default `Asia/Shanghai`).

### 3. Notion Connection Panel

- Configures the Notion integration token (write-only in the UI; never returned in plaintext once saved), `cardsDb`, `recordsDb`, optional `accountsDb`, field `preset` (`zh`, `en`, or `custom`), and custom JSON `mapping` (exposed in `AdminStatus.notion.preset` and accepted by `PUT /api/admin/notion`). Saving Notion settings shows a warning toast if the subsequent sync reports `fieldIssues`.
- **Template Auto-Detection (`POST /api/admin/notion/detect`)**: Requires authentication and CSRF header; accepts `{ token?: string }` (uses the token typed in the form if given, validated to 20–200 chars, or falls back to the saved token). `detectTemplates(client)` in `server/detect.ts` searches data sources shared with the integration via `POST /v1/search` (filtered to `data_source`, up to 5 pages × 100): a data source with at least 10 of a preset's card column names is recognized as a SIM Cards database (best-matching preset wins), the Expense Records database is identified via its `records.card` relation pointing to that card database, and the Payment Accounts database is identified as the target of `cards.paymentAccounts`. Returns `{ matches: DetectMatch[] }` (`{ preset, cards, records, accounts, matchedColumns }`, with `{ id, title }` per database), ordered with complete matches first. The admin UI populates the preset and database IDs automatically when there is a single match, or lets the owner pick when multiple matches are found; saving remains a separate step.

### 4. Account Security Panel

- Change the owner password, rebind TOTP two-factor authentication, regenerate one-time recovery codes, or revoke other active sessions.

## Sync Schedule, Field Health Check, and Caching

- **Daily Schedule**: `SyncService` calculates the next occurrence of the configured `HH:mm` in the configured timezone using `Intl.DateTimeFormat` and schedules a timer.
- **Stale Startup Sync & Backfill**: On server startup, cached records missing `kind` are backfilled via `SyncService.backfillRecordKinds`. If Notion is configured and the cached data is missing or older than 25 hours (`STALE_AFTER_MS`), a background sync triggers automatically after 3 seconds.
- **Field Health Check (`server/fieldcheck.ts`)**: Each sync resets `SyncStatus.fieldIssues` to `null` at the start, then runs `checkFields(db, schema, mapping)` against the resolved `cards` and `records` data source schemas. It reports missing columns (`problem: 'missing'`) or incompatible property types (`problem: 'type'`, with `actualType` and `expectedTypes`). Title mappings (`cards.name`, `records.title`) are not flagged if the database has any `title` column (title fallback). Acceptable property types per extractor are:
  - Text fields: `title`, `rich_text`, `select`, `status`, `phone_number`, `email`, `url`, `number`, `multi_select`, `formula`, `rollup`
  - Number fields: `number`, `formula`, `rollup`
  - Date fields: `date`, `created_time`, `formula`, `rollup`
  - List fields: `multi_select`, `rollup`, plus all text types
  - Relation fields: `relation`
- **Local Cache**: Synced cards are stored in `<DATA_DIR>/cache.json` and sync metadata in `<DATA_DIR>/sync-status.json`. Visitor page loads read exclusively from memory/disk cache and never trigger requests to Notion.
- **Rate Limiting & Retries**: `NotionClient` spaces requests by at least `350 ms` (`MIN_INTERVAL_MS`), enforces a `20 s` timeout per request, and retries HTTP `429`, `5xx`, and network errors up to 4 times (honoring `Retry-After` headers or exponential backoff).
- **Failure Handling**: If a sync fails, the previous `cache.json` is kept intact and `lastError` is recorded in `sync-status.json`.

## Environment Variables

Defined in `server/config.ts`, `Dockerfile`, and `deploy/compose.yaml`:

| Variable             | Default                                     | Description                                                                                               |
| -------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `PORT`               | `25780`                                     | HTTP port the Node server listens on.                                                                     |
| `HOST`               | `0.0.0.0`                                   | Network interface address to bind (`deploy/compose.yaml` publishes `127.0.0.1:25780:25780` on the host).  |
| `DATA_DIR`           | `<repo>/data` (`/data` in Docker)           | Directory for persistent state, cache, setup key, and carrier logos.                                      |
| `STATIC_DIR`         | `<repo>/dist` (`/app/dist` in Docker)       | Directory containing the built frontend assets.                                                           |
| `TRUST_PROXY`        | `none`                                      | How client IP addresses are determined for login rate limiting (`none`, `cloudflare`, or `xff`).          |
| `TZ`                 | System default (`Asia/Shanghai` in Compose) | Container/process timezone.                                                                               |
| `NOTION_TOKEN`       | Unset                                       | Default Notion integration token if none is saved in the admin panel.                                     |
| `NOTION_CARDS_DB`    | Unset                                       | Default SIM Cards database ID / data source ID / URL if none is saved in the admin panel.                 |
| `NOTION_RECORDS_DB`  | Unset                                       | Default Expense Records database ID / data source ID / URL if none is saved in the admin panel.           |
| `NOTION_ACCOUNTS_DB` | Unset                                       | Default optional Payment Accounts database ID / data source ID / URL if none is saved in the admin panel. |
| `GIT_HASH`           | `dev` (`unknown` in Docker build)           | Build commit identifier exposed by the server.                                                            |

### `TRUST_PROXY`

Login rate limiting locks an IP address for 15 minutes after 5 consecutive failed attempts (and refuses all sign-in attempts once 20 failures across all IPs fall within a 15-minute window). `TRUST_PROXY` controls where SIMerald reads the client IP:

- `none` (default): Uses the direct socket remote address. Use this only when there is no reverse proxy in front of SIMerald.
- `cloudflare`: Reads `CF-Connecting-IP`. Use this when all traffic arrives through Cloudflare proxy or Cloudflare Tunnel.
- `xff`: Reads the last address in `X-Forwarded-For`. Use this when traffic arrives through a local reverse proxy such as Nginx or Caddy that appends the client IP to `X-Forwarded-For`.

Do not enable `cloudflare` or `xff` if clients can connect directly to the Node port without passing through the proxy, as attackers could forge headers to bypass per-IP rate limiting. Unrecognized `TRUST_PROXY` values log a warning and fall back to `none`.

## Data Directory and Backups

All mutable state lives inside `DATA_DIR` (`/data` inside the container, `./data` on the host in `deploy/compose.yaml`):

- `auth.json`: owner credentials (scrypt password hash, TOTP secret, recovery codes, active sessions)
- `setup-key.txt`: one-time setup key, present only until initial setup is completed
- `settings.json`: site, theme, sync and Notion connection settings (including `notion.preset` and `notion.mapping`)
- `secrets.json`: the Notion token and the `idKey` HMAC secret
- `cache.json`: Cached `SimCard[]` payload and `syncedAt` timestamp
- `sync-status.json`: Last sync timestamps, counts, warnings, `fieldIssues`, and errors
- `logos/`: User-supplied carrier logo image files

Back up the entire `data/` directory to preserve your credentials, settings, logos, and cached data. In Docker deployments, the container runs as user `node` (UID `1000`, GID `1000`), so the host directory must be owned by `1000:1000`.

## Demo Mode

When no Notion token is configured (neither in the admin panel nor via `NOTION_TOKEN`), `SyncService.isDemo()` returns `true`:

- `/api/cards` serves built-in fictional SIM cards generated by `server/demo.ts`.
- The demo-mode banner on the home page links to the Notion setup tutorial (`src/utils/links.ts` `NOTION_SETUP_URL`, pointing to `docs/notion-setup.zh-CN.md` on GitHub).
- Scheduled startup syncs are skipped until a Notion token and database IDs are saved.
