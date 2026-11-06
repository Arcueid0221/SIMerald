/**
 * Shared types between frontend and backend.
 * Executed directly via Node native type-stripping; must contain only type declarations (no runtime syntax like enums).
 */

export type CardStatus = 'active' | 'expired' | 'cancelled'

/** High-level card category, determines the icon */
export type CardKind = 'physical' | 'adapter' | 'embedded' | 'virtual'

/** Internal category of an expense record, resolved by the backend from the record type label */
export type RecordKind = 'purchase' | 'renewal' | 'topup' | 'other'

/** Keep-alive action matching an option of the official templates; lets the UI translate the label */
export type KeepAliveCode = 'topup' | 'addon' | 'use' | 'balanceChange' | 'autoCharge' | 'plan'

/** Notion select option colors */
export type NotionColor
  = | 'default' | 'gray' | 'brown' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'red'

export interface SimRecord {
  /** Opaque ID derived from the Notion page ID (irreversible) */
  id: string
  /** Transaction category label as written in Notion */
  type: string
  kind: RecordKind
  /** Transaction date (YYYY-MM-DD) */
  date: string | null
  /** Payment amount in original currency */
  amount: number | null
  /** ISO currency code */
  currency: string
  /** Exchange rate at transaction time (1 unit of foreign currency in CNY) */
  rate: number | null
  /** Equivalent amount in CNY (calculated by Notion formula) */
  amountCNY: number | null
  /** New expiration date after this transaction (YYYY-MM-DD) */
  extendsTo: string | null
  /** Returned only when authenticated: record title */
  title?: string
  /** Returned only when authenticated: payment account names */
  accounts?: string[]
}

export interface SimCard {
  /** Opaque ID derived from the Notion page ID, used in detail URLs; raw Notion link is only in notionUrl when authenticated */
  id: string
  /** Display name, e.g. "Harbour Mobile · 0123" */
  name: string
  /** Short carrier name, e.g. "Harbour Mobile" */
  carrier: string
  /** Last 4 digits of the phone number */
  last4: string
  /** Masked phone number for public display, e.g. "•••• 0123" */
  numberMasked: string
  /** Flag emoji, e.g. "🇪🇪", or empty string if none */
  region: string
  /** Country or region name */
  countryName: string
  typeKind: CardKind
  typeColor: NotionColor
  /** Actions required to keep the number active, as written in Notion */
  keepAlive: string[]
  /** Same order as `keepAlive`; null for labels that are not template options */
  keepAliveCodes: (KeepAliveCode | null)[]
  /** Renewal cycle in days, or 0 if irregular */
  cycleDays: number
  /** Raw renewal cycle text */
  cycleLabel: string
  /** Renewal price */
  price: number
  /** ISO currency code for renewal price */
  currency: string
  /** Current expiration date */
  expiresAt: string | null
  /** Next renewal date (start date if a date range) */
  nextRenewalAt: string | null
  /** End date when next renewal date is a range */
  nextRenewalEnd: string | null
  /** Current period start date (date of the transaction that set the current expiration) */
  periodStart: string | null
  status: CardStatus
  statusLabel: string
  cancelledAt: string | null
  firstPurchaseAt: string | null
  totalSpentCNY: number | null
  /** Raw renewal urgency text, usable for sorting */
  urgency: string | null
  /** Display order from Notion */
  order: number
  history: SimRecord[]
  /** Carrier logo URL, populated by the API when a matching file exists in the data logos/ directory */
  logo?: string | null
  // Fields below are returned only when authenticated
  /** Raw card type label */
  type?: string
  balance?: number | null
  balanceUpdatedAt?: string | null
  /** Primary device */
  device?: string | null
  number?: string | null
  services?: string[]
  account?: string | null
  paymentAccounts?: string[]
  dataCheck?: string | null
  notionUrl?: string | null
}

export type ThemeSettings = Record<string, string | number | boolean>

/** Interpolation values for a translatable error or warning code */
export type ErrorParams = Record<string, string | number>

/**
 * Body of a failed API response. `code` is translated by the UI (`errors.<code>`); `error` is an
 * English message for logs and API clients.
 */
export interface ApiErrorBody {
  error: string
  code: string
  params?: ErrorParams
  /** Seconds until the next attempt is allowed (429 only) */
  retryAfter?: number
}

/** Why a sync started */
export type SyncReason = 'startup' | 'daily' | 'settings' | 'manual'

export interface SiteInfo {
  sitename: string
  version: string
  gitHash: string
  /** True when Notion is not configured and built-in demo data is served */
  demo: boolean
  syncedAt: string | null
  loggedIn: boolean
  setupRequired: boolean
  theme_settings: ThemeSettings
}

export interface CardsResponse {
  cards: SimCard[]
  syncedAt: string | null
  demo: boolean
  full: boolean
}

export interface SyncStatus {
  running: boolean
  lastStartedAt: string | null
  lastFinishedAt: string | null
  lastSuccessAt: string | null
  /** English message of the last failure; installations upgraded from v0.2 may hold a Chinese one */
  lastError: string | null
  /** Translatable code of `lastError`; null for messages written before v0.3 */
  lastErrorCode: string | null
  lastErrorParams: ErrorParams | null
  /** Warning when sync succeeded with some entries skipped */
  lastWarning: string | null
  lastWarningCode: string | null
  lastWarningParams: ErrorParams | null
  /** A `SyncReason`, or free text written before v0.3 */
  lastReason: string | null
  cardCount: number
  recordCount: number
  nextRunAt: string | null
  /** Mapped columns that are missing or have an unexpected type, from the last sync; null when not checked */
  fieldIssues: FieldIssue[] | null
}

export type NotionDbKey = 'cards' | 'records'

/** A mapped column that could not be read as expected */
export interface FieldIssue {
  db: NotionDbKey
  /** Mapping key, e.g. `expiresAt` */
  key: string
  /** Column name SIMerald looked for */
  column: string
  problem: 'missing' | 'type'
  /** Actual Notion property type when `problem` is `type` */
  actualType?: string
  /** Notion property types SIMerald can read for this field */
  expectedTypes: string[]
  /** True when the field drives the public card wall (validity, status, prices…) */
  important: boolean
}

export type MappingPresetChoice = 'zh' | 'en' | 'custom'

export interface DetectedDatabase {
  id: string
  title: string
}

/** One complete template found by auto-detection */
export interface DetectMatch {
  preset: 'zh' | 'en'
  cards: DetectedDatabase
  records: DetectedDatabase | null
  accounts: DetectedDatabase | null
  /** Number of preset columns found in the cards database */
  matchedColumns: number
}

export interface NotionSettingsView {
  tokenConfigured: boolean
  /** True when the token is set via environment variable and cannot be modified in the UI */
  tokenFromEnv: boolean
  cardsDb: string
  recordsDb: string
  accountsDb: string
  preset: MappingPresetChoice
  /** Custom mapping JSON, used when `preset` is `custom` */
  mapping: string
}

export interface AdminStatus {
  sync: SyncStatus
  notion: NotionSettingsView
  syncTime: string
  timezone: string
  recoveryCodesLeft: number
  sessions: number
}
