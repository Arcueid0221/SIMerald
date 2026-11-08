/**
 * Shared types between frontend and Worker backend.
 * Must contain only type declarations (no runtime syntax like enums).
 */

export type CardStatus = 'active' | 'expired' | 'cancelled'

/** High-level card category, determines the icon */
export type CardKind = 'physical' | 'adapter' | 'embedded' | 'virtual'

/** Internal category of an expense record, resolved by the backend from the record type label */
export type RecordKind = 'purchase' | 'renewal' | 'topup' | 'other'

/** Keep-alive action with a known label; lets the UI translate it */
export type KeepAliveCode = 'topup' | 'addon' | 'use' | 'balanceChange' | 'autoCharge' | 'plan'

/** Accent color of the card type tag */
export type TagColor
  = | 'default' | 'gray' | 'brown' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'red'

export interface SimRecord {
  /** Row ID, unique within the card */
  id: string
  /** Record type label as written in the note */
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
  /** Equivalent amount in CNY (amount × rate; equals amount for CNY) */
  amountCNY: number | null
  /** New expiration date after this transaction (YYYY-MM-DD) */
  extendsTo: string | null
  /** Returned only when authenticated: note column */
  title?: string
  /** Returned only when authenticated: payment account names */
  accounts?: string[]
}

export interface SimCard {
  /** Opaque ID derived from the note path (keyed hash), used in detail URLs */
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
  typeColor: TagColor
  /** Actions required to keep the number active, as written in the note */
  keepAlive: string[]
  /** Same order as `keepAlive`; null for labels outside the known vocabulary */
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
  /** Display order: position of the note in file-name order */
  order: number
  history: SimRecord[]
  /** Carrier logo URL, populated when a matching file exists in the vault's logos/ folder */
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
  /** Problems found in the note, joined into one line; null when the note looks fine */
  dataCheck?: string | null
  /** Path of the source note inside the vault */
  source?: string | null
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
}

export interface SiteInfo {
  sitename: string
  version: string
  gitHash: string
  /** True before the first successful sync, when built-in demo data is served */
  demo: boolean
  syncedAt: string | null
  /** True when the request carries a valid Cloudflare Access login */
  loggedIn: boolean
  theme_settings: ThemeSettings
}

export interface CardsResponse {
  cards: SimCard[]
  syncedAt: string | null
  demo: boolean
  full: boolean
}

/** A note that was skipped or read with problems during the last sync */
export interface NoteIssue {
  /** Note path inside the vault */
  file: string
  /** Translatable code, e.g. `note.badFrontmatter` */
  code: string
  params: ErrorParams
  /** English message for logs */
  message: string
  /** True when the note was skipped entirely */
  skipped: boolean
}

export interface SyncStatus {
  lastFinishedAt: string | null
  lastSuccessAt: string | null
  /** English message of the last failure */
  lastError: string | null
  /** Translatable code of `lastError` */
  lastErrorCode: string | null
  lastErrorParams: ErrorParams | null
  cardCount: number
  recordCount: number
  /** Notes with problems found by the last successful sync */
  issues: NoteIssue[]
}

export interface AdminStatus {
  sync: SyncStatus
  /** Email of the signed-in Cloudflare Access user */
  email: string | null
  /** Folder inside the R2 bucket that holds the card notes */
  cardsFolder: string
}
