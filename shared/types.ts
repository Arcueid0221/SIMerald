/**
 * Shared types between frontend and backend.
 * Executed directly via Node native type-stripping; must contain only type declarations (no runtime syntax like enums).
 */

export type CardStatus = 'active' | 'expired' | 'cancelled'

/** High-level card category, determines the icon */
export type CardKind = 'physical' | 'adapter' | 'embedded' | 'virtual'

/** Notion select option colors */
export type NotionColor
  = | 'default' | 'gray' | 'brown' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'red'

export interface SimRecord {
  /** Opaque ID derived from the Notion page ID (irreversible) */
  id: string
  /** Transaction category (initial purchase, renewal, top-up, or other fee) */
  type: string
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
  /** Actions required to keep the number active */
  keepAlive: string[]
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
  lastError: string | null
  /** Warning when sync succeeded with some entries skipped */
  lastWarning: string | null
  lastReason: string | null
  cardCount: number
  recordCount: number
  nextRunAt: string | null
}

export interface NotionSettingsView {
  tokenConfigured: boolean
  /** True when the token is set via environment variable and cannot be modified in the UI */
  tokenFromEnv: boolean
  cardsDb: string
  recordsDb: string
  accountsDb: string
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
