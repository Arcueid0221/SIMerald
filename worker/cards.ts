import type { CardKind, CardStatus, SimCard, SimRecord, TagColor } from '../shared/types.ts'
import type { ParsedNote, PropValue } from './obsidian.ts'
import { NoteError } from './obsidian.ts'
import { resolveKeepAliveCode, resolveRecordKind, STATUS_VALUES } from './vocab.ts'

/**
 * Turns parsed notes into full SimCard objects and derives what the original Notion template computed with
 * formulas (current expiry, status, next renewal, CNY amounts, totals). Public responses must pass through
 * view.ts for redaction.
 */

const REGION_FLAG_REGEX = /[\u{1F1E6}-\u{1F1FF}]{2}/u
const CURRENCY_CODE_REGEX = /\b([A-Z]{3})\b/
const NUMBER_IN_TEXT_REGEX = /-?\d+(?:\.\d+)?/
const NON_DIGIT_REGEX = /\D/g
const DATE_REGEX = /(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/
const RANGE_SEPARATOR_REGEX = /\s*(?:[~～→至]|\bto\b)\s*/
const SPACES_REGEX = /\s+/g
const LIST_SEPARATOR_REGEX = /[,，、]/
const YEAR_REGEX = /年|year/i
const MONTH_REGEX = /月|month/i
const TAG_COLORS = new Set<TagColor>(['default', 'gray', 'brown', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'red'])

const KIND_COLORS: Record<CardKind, TagColor> = {
  physical: 'brown',
  embedded: 'blue',
  adapter: 'purple',
  virtual: 'gray',
}

/** Property names accepted for each card field (first one is what the template uses) */
const PROPS = {
  carrier: ['运营商', 'carrier'],
  name: ['名称', '卡片名称', 'name'],
  number: ['号码', 'number'],
  country: ['国家', '号码国家', 'country'],
  type: ['类型', '卡片类型', 'type'],
  color: ['颜色', 'color'],
  device: ['设备', '主要使用设备', 'device'],
  keepAlive: ['保号方式', '保号动作', 'keepalive'],
  cycle: ['续费周期', 'cycle'],
  price: ['续费金额', 'price'],
  currency: ['币种', '续费币种', 'currency'],
  balance: ['余额', '当前余额', 'balance'],
  balanceUpdatedAt: ['余额更新日期', 'balanceupdated'],
  nextRenewal: ['下次续费（手动）', '下次续费', '下次续费日期（手动覆盖）', 'nextrenewal'],
  cancelledAt: ['停用日期', 'cancelled'],
  firstPurchaseAt: ['首次购买日期', 'firstpurchase'],
  services: ['绑定服务', '绑定的服务', 'services'],
  account: ['管理账号', 'account'],
  paymentAccounts: ['扣款账户', '默认扣款账户', 'paymentaccounts'],
} satisfies Record<string, string[]>

type PropKey = keyof typeof PROPS

function normalizeKey(key: string): string {
  return key.replace(SPACES_REGEX, '').toLowerCase()
}

function lookup(props: Record<string, PropValue>, key: PropKey): PropValue | undefined {
  const wanted = PROPS[key].map(normalizeKey)
  for (const [name, value] of Object.entries(props)) {
    if (wanted.includes(normalizeKey(name)))
      return value
  }
  return undefined
}

function text(props: Record<string, PropValue>, key: PropKey): string | null {
  const value = lookup(props, key)
  const joined = Array.isArray(value) ? value.join(', ') : value
  return joined?.trim() || null
}

function list(props: Record<string, PropValue>, key: PropKey): string[] {
  const value = lookup(props, key)
  if (Array.isArray(value))
    return value
  // A single text value may hold several items separated by commas
  return value ? value.split(LIST_SEPARATOR_REGEX).map(s => s.trim()).filter(Boolean) : []
}

export function toDate(value: string | null | undefined): string | null {
  const match = value?.match(DATE_REGEX)
  if (!match)
    return null
  const [, y, m, d] = match
  return `${y}-${m!.padStart(2, '0')}-${d!.padStart(2, '0')}`
}

export function toNumber(value: string | null | undefined): number | null {
  if (!value)
    return null
  const match = value.replaceAll(',', '').match(NUMBER_IN_TEXT_REGEX)
  return match ? Number(match[0]) : null
}

/** Accepts a single date or a range like `2026-12-01 ~ 2026-12-10` */
function toDateRange(value: string | null): { start: string | null, end: string | null } {
  if (!value)
    return { start: null, end: null }
  const [first, second] = value.split(RANGE_SEPARATOR_REGEX)
  return { start: toDate(first), end: toDate(second) }
}

export function parseCurrency(value: string | null): string {
  if (!value)
    return 'CNY'
  const match = value.toUpperCase().match(CURRENCY_CODE_REGEX)
  return match?.[1] ?? 'CNY'
}

export function parseCycleDays(value: string | null): number {
  const n = toNumber(value)
  if (!n || n <= 0)
    return 0
  if (value && YEAR_REGEX.test(value))
    return Math.round(n * 365)
  if (value && MONTH_REGEX.test(value))
    return Math.round(n * 30)
  return Math.round(n)
}

export function parseCountry(value: string | null): { region: string, name: string } {
  if (!value)
    return { region: '', name: '' }
  const flag = value.match(REGION_FLAG_REGEX)?.[0] ?? ''
  const name = value.replace(REGION_FLAG_REGEX, '').trim()
  return { region: flag, name: name || value.trim() }
}

export function detectKind(type: string): CardKind {
  const lower = type.toLowerCase()
  if (lower.includes('虚拟') || lower.includes('virtual') || lower.includes('app'))
    return 'virtual'
  if (lower.includes('实体') || lower.includes('physical'))
    return 'physical'
  if (lower.includes('卡托') || lower.includes('贴片') || lower.includes('adapter') || lower.includes('estk') || lower.includes('euicc'))
    return 'adapter'
  if (lower.includes('esim'))
    return 'embedded'
  return 'physical'
}

/** Today's date (YYYY-MM-DD) in the given IANA timezone */
export function todayIn(timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function buildRecord(row: ParsedNote['rows'][number], index: number, fallbackCurrency: string): SimRecord {
  const currency = row.currency ? parseCurrency(row.currency) : fallbackCurrency
  const amount = toNumber(row.amount)
  const rate = currency === 'CNY' ? 1 : toNumber(row.rate)
  return {
    id: String(index + 1),
    type: row.type,
    kind: resolveRecordKind(row.type),
    date: toDate(row.date),
    amount,
    currency,
    rate,
    amountCNY: amount !== null && rate !== null ? round2(amount * rate) : null,
    extendsTo: toDate(row.extendsTo),
    title: row.note,
    accounts: row.accounts ? row.accounts.split(LIST_SEPARATOR_REGEX).map(s => s.trim()).filter(Boolean) : [],
  }
}

/** Same rule as the old "current expiry" formula: the latest transaction day wins, then the latest extension that day */
function currentExpiry(history: SimRecord[]): { expiresAt: string | null, periodStart: string | null } {
  let best: SimRecord | null = null
  for (const r of history) {
    if (!r.date || !r.extendsTo)
      continue
    if (!best || r.date > best.date! || (r.date === best.date && r.extendsTo > best.extendsTo!))
      best = r
  }
  return { expiresAt: best?.extendsTo ?? null, periodStart: best?.date ?? null }
}

export function resolveStatus(cancelledAt: string | null, expiresAt: string | null, today: string): CardStatus {
  if (cancelledAt)
    return 'cancelled'
  if (expiresAt && expiresAt < today)
    return 'expired'
  return 'active'
}

/**
 * Builds a card from a parsed note. `problems` collects what looks wrong (shown to the owner only);
 * a note without a carrier cannot become a card and throws.
 */
export function buildCard(note: ParsedNote, meta: { id: string, file: string, order: number, today: string }): { card: StoredCard, problems: string[] } {
  const p = note.props
  const problems: string[] = []
  const carrier = text(p, 'carrier')
  if (!carrier)
    throw new NoteError('note.noCarrier', 'The note has no "运营商" property', { property: '运营商' })

  const number = text(p, 'number')
  const digits = (number ?? '').replace(NON_DIGIT_REGEX, '')
  const last4 = digits.slice(-4)
  if (digits.length < 4)
    problems.push('缺号码（至少要有后 4 位）')

  const type = text(p, 'type') ?? ''
  const typeKind = detectKind(type)
  const colorText = text(p, 'color')?.toLowerCase() as TagColor | undefined
  const currency = parseCurrency(text(p, 'currency'))
  const cycleLabel = text(p, 'cycle') ?? ''
  const country = parseCountry(text(p, 'country'))
  if (!country.name)
    problems.push('缺「国家」')

  const history = note.rows
    .map((row, index) => buildRecord(row, index, currency))
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || (b.extendsTo ?? '').localeCompare(a.extendsTo ?? ''))
  for (const r of history) {
    if (!r.date)
      problems.push(`第 ${r.id} 行记录缺日期`)
    if (r.amount !== null && r.amountCNY === null)
      problems.push(`第 ${r.id} 行是外币但没填汇率`)
  }

  const { expiresAt, periodStart } = currentExpiry(history)
  const cancelledAt = toDate(text(p, 'cancelledAt'))
  if (!expiresAt && !cancelledAt)
    problems.push('没有任何记录填了「有效期延至」')
  const status = resolveStatus(cancelledAt, expiresAt, meta.today)
  if (status === 'expired')
    problems.push('已过期：续了就补一条记录，没续就填「停用日期」')
  const override = toDateRange(text(p, 'nextRenewal'))
  const keepAlive = list(p, 'keepAlive')
  const spent = history.reduce((sum, r) => sum + (r.amountCNY ?? 0), 0)
  const firstDated = [...history].reverse().find(r => r.date)?.date ?? null

  const card: SimCard = {
    id: meta.id,
    name: text(p, 'name') ?? (last4 ? `${carrier} · ${last4}` : carrier),
    carrier,
    last4,
    numberMasked: last4 ? `•••• ${last4}` : '••••',
    region: country.region,
    countryName: country.name,
    type,
    typeKind,
    typeColor: colorText && TAG_COLORS.has(colorText) ? colorText : KIND_COLORS[typeKind],
    device: text(p, 'device'),
    keepAlive,
    keepAliveCodes: keepAlive.map(resolveKeepAliveCode),
    cycleDays: parseCycleDays(cycleLabel),
    cycleLabel,
    price: toNumber(text(p, 'price')) ?? 0,
    currency,
    balance: toNumber(text(p, 'balance')),
    balanceUpdatedAt: toDate(text(p, 'balanceUpdatedAt')),
    expiresAt,
    nextRenewalAt: null,
    nextRenewalEnd: null,
    periodStart,
    status,
    statusLabel: STATUS_VALUES[status][0]!,
    cancelledAt,
    firstPurchaseAt: toDate(text(p, 'firstPurchaseAt')) ?? firstDated,
    totalSpentCNY: history.length ? round2(spent) : null,
    order: meta.order,
    history,
    number,
    services: list(p, 'services'),
    account: text(p, 'account'),
    paymentAccounts: list(p, 'paymentAccounts'),
    dataCheck: null,
    source: meta.file,
  }
  card.dataCheck = problems.length ? problems.join('；') : null
  // The manual override is kept so the next renewal can be recomputed on every read
  const stored: StoredCard = { ...card, nextRenewalOverride: override.start ? override : null }
  return { card: stored, problems }
}

/** A card as kept in the synced snapshot: carries the manual next-renewal date, which is not part of SimCard */
export interface StoredCard extends SimCard {
  nextRenewalOverride: { start: string | null, end: string | null } | null
}

/**
 * Returns the card with its date-dependent fields (status, next renewal) computed for `today`.
 * Called on every read, so nothing goes stale between syncs. The result is a plain SimCard.
 */
export function withToday(stored: StoredCard, today: string): SimCard {
  const { nextRenewalOverride: override, ...card } = stored
  const status = resolveStatus(card.cancelledAt, card.expiresAt, today)
  const cancelled = status === 'cancelled'
  return {
    ...card,
    status,
    statusLabel: STATUS_VALUES[status][0]!,
    nextRenewalAt: cancelled ? null : override?.start ?? card.expiresAt,
    nextRenewalEnd: cancelled || !override?.start ? null : override.end,
  }
}
