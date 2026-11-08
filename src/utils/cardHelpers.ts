import type { CardStatus, SimCard, SimRecord } from '@shared/types'
import type { AppLocale } from '@/i18n'
import type { ExchangeRates } from '@/utils/financeHelper'
import dayjs from 'dayjs'
import { compareText, currentLocale, formatNumber, i18n } from '@/i18n'
import { CURRENCY_SYMBOLS, normalizeCurrency } from '@/utils/financeHelper'
import { getRegionCode } from '@/utils/regionHelper'
import { parseBillingCycleType } from '@/utils/tagHelper'

const { t } = i18n.global

/** Expiry thresholds matching Emerald: <7 days critical (red), <15 days warning (yellow) */
const CRITICAL_DAYS = 7
const WARNING_DAYS = 15
const LONG_TERM_DAYS = 36500
const LEADING_ESIM_REGEX = /^eSIM\s*[·•]\s*/i
const REGION_CODE_REGEX = /^[A-Z]{2}$/

export type RenewalState = 'overdue' | 'critical' | 'warning' | 'normal' | 'long_term' | 'none'
export type BarStatus = 'default' | 'success' | 'warning' | 'error' | 'info'

function today() {
  return dayjs().startOf('day')
}

/** Calendar days until `date`, or `null` if empty or invalid */
export function daysUntil(date: string | null | undefined): number | null {
  if (!date)
    return null
  const target = dayjs(date)
  if (!target.isValid())
    return null
  return target.startOf('day').diff(today(), 'day')
}

export function daysSince(date: string | null | undefined): number | null {
  const days = daysUntil(date)
  return days === null ? null : -days
}

export function getRenewalDays(card: SimCard): number | null {
  if (card.status === 'cancelled')
    return null
  return daysUntil(card.nextRenewalAt ?? card.expiresAt)
}

export function getRenewalState(card: SimCard): RenewalState {
  const days = getRenewalDays(card)
  if (days === null)
    return 'none'
  if (days < 0)
    return 'overdue'
  if (days < CRITICAL_DAYS)
    return 'critical'
  if (days < WARNING_DAYS)
    return 'warning'
  if (days > LONG_TERM_DAYS)
    return 'long_term'
  return 'normal'
}

export function getRenewalTextClass(card: SimCard): string {
  const state = getRenewalState(card)
  if (state === 'overdue' || state === 'critical')
    return 'text-destructive'
  if (state === 'warning')
    return 'text-yellow-600 dark:text-yellow-400'
  if (state === 'long_term' || state === 'none')
    return 'text-muted-foreground'
  return ''
}

/** Validity tier based on the fraction of the current billing cycle remaining */
export type ValidityTone = 'critical' | 'urgent' | 'warning' | 'fair' | 'good' | 'none'

/** Text color classes per validity tier; rings and progress bars inherit via `currentColor` */
export const VALIDITY_TONE_TEXT: Record<ValidityTone, string> = {
  critical: 'text-destructive',
  urgent: 'text-orange-500',
  warning: 'text-warning',
  fair: 'text-lime-500',
  good: 'text-success',
  none: 'text-muted-foreground/40',
}

export interface ValidityInfo {
  /** Days until expiry, or `null` if unrecorded or cancelled */
  left: number | null
  /** Total days in the current cycle (period start to expiry) */
  total: number
  /** Remaining fraction of the current cycle, clamped to 0..1 */
  ratio: number
  tone: ValidityTone
  /** Whether <=50% of the cycle remains, triggering colored day-count text */
  hot: boolean
}

export function getValidity(card: SimCard): ValidityInfo {
  const end = card.expiresAt ?? card.nextRenewalAt
  if (card.status === 'cancelled' || !end)
    return { left: null, total: 0, ratio: 0, tone: 'none', hot: false }
  const endDay = dayjs(end).startOf('day')
  const start = card.periodStart
    ? dayjs(card.periodStart).startOf('day')
    : endDay.subtract(card.cycleDays || 365, 'day')
  const total = Math.max(endDay.diff(start, 'day'), 1)
  const left = endDay.diff(today(), 'day')
  const ratio = Math.max(0, Math.min(1, left / total))
  const tone: ValidityTone = ratio <= 0.1
    ? 'critical'
    : ratio <= 0.25 ? 'urgent' : ratio <= 0.5 ? 'warning' : ratio <= 0.75 ? 'fair' : 'good'
  return { left, total, ratio, tone, hot: ratio <= 0.5 }
}

/** Remaining days with unit, e.g. `120 天` / `过期 3 天` */
export function getValidityDaysText(validity: ValidityInfo): string {
  if (validity.left === null)
    return '-'
  return validity.left < 0 ? t('days.overdue', -validity.left) : t('days.count', validity.left)
}

export function getValidityTooltip(card: SimCard, validity: ValidityInfo): string {
  if (card.status === 'cancelled')
    return card.cancelledAt ? t('validity.cancelledOn', { date: card.cancelledAt }) : t('status.cancelled')
  if (validity.left === null)
    return t('validity.noRecord')
  const end = card.expiresAt ?? card.nextRenewalAt ?? ''
  return t('validity.tooltip', { total: t('days.count', validity.total), left: t('days.count', Math.max(validity.left, 0)), end })
}

export function isPurchaseRecord(record: SimRecord): boolean {
  return record.kind === 'purchase'
}

export interface PurchaseInfo {
  /** Initial purchase amount in CNY */
  cny: number | null
  /** Formatted amount in original currency, e.g. `€4.14` */
  original: string | null
  date: string | null
}

export function getPurchase(card: SimCard): PurchaseInfo {
  const record = card.history
    .filter(isPurchaseRecord)
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))[0]
  if (!record)
    return { cny: null, original: null, date: card.firstPurchaseAt }
  return {
    cny: record.amountCNY,
    original: record.amount === null ? null : formatAmount(record.amount, record.currency),
    date: record.date ?? card.firstPurchaseAt,
  }
}

export interface KeepCostInfo {
  /** Compact label for cards: `¥243` / `免费` / `不固定` (Chinese UI) */
  short: string
  /** Label with unit: `¥243/年` / `免费保号` / `周期不固定` */
  long: string
  /** Tooltip with original-currency renewal price and keep-alive method */
  tooltip: string
}

/** Joins a list of labels with the separator of the current language (`、` / `, `) */
export function joinList(items: string[]): string {
  return items.join(t('common.listSeparator'))
}

/** Keep-alive actions in the current language; labels outside the known vocabulary stay as written in the note */
export function keepAliveLabels(card: SimCard): string[] {
  return card.keepAlive.map((label, index) => {
    const code = card.keepAliveCodes?.[index]
    return code ? t(`keepAlive.${code}`) : label
  })
}

/** Renewal cycle in the current language, e.g. `每 365 天`; irregular cycles read `不固定` */
export function cycleText(card: SimCard): string {
  if (card.cycleDays > 0)
    return t('cycle.every', card.cycleDays)
  return card.cycleLabel ? t('cycle.varies') : '-'
}

/** Billing period for price units, e.g. `年` / `year`; cycles that are not a standard period read as days */
export function billingPeriodText(cycleDays: number): string {
  const type = parseBillingCycleType(cycleDays)
  return type === 'custom' || type === 'once' ? t('days.count', cycleDays) : t(`billingPeriod.${type}`)
}

export function recordKindLabel(record: SimRecord): string {
  if (record.kind === 'other')
    return record.type || t('recordKinds.other')
  return t(`recordKinds.${record.kind}`)
}

// Intl names for these regions carry a political qualifier ("中国香港特别行政区", "Hong Kong SAR China"); use the short forms
const REGION_NAME_OVERRIDES: Record<AppLocale, Record<string, string>> = {
  'zh-CN': { HK: '中国香港', MO: '中国澳门', TW: '中国台湾' },
  'en': { HK: 'Hong Kong', MO: 'Macao', TW: 'Taiwan' },
}

const regionNames = new Map<AppLocale, Intl.DisplayNames>()

/** Country name in the current language from the flag emoji, falling back to the name written in the note */
export function countryName(card: SimCard): string {
  if (!card.region)
    return card.countryName
  const code = getRegionCode(card.region).toUpperCase()
  if (!REGION_CODE_REGEX.test(code))
    return card.countryName
  const locale = currentLocale()
  const override = REGION_NAME_OVERRIDES[locale][code]
  if (override)
    return override
  let names = regionNames.get(locale)
  if (!names) {
    names = new Intl.DisplayNames([locale], { type: 'region', fallback: 'code' })
    regionNames.set(locale, names)
  }
  try {
    const name = names.of(code)
    return name && name !== code ? name : card.countryName
  }
  catch {
    return card.countryName
  }
}

/** Estimated annual keep-alive cost in CNY; computed even for cancelled cards (masked by the UI) */
export function getKeepCost(card: SimCard, rates: ExchangeRates): KeepCostInfo {
  const how = joinList(keepAliveLabels(card)) || t('keepCost.noMethod')
  if (card.cycleDays <= 0)
    return { short: t('keepCost.variesShort'), long: t('keepCost.varies'), tooltip: `${t('keepCost.varies')} · ${how}` }
  if (card.price <= 0)
    return { short: t('keepCost.freeShort'), long: t('keepCost.free'), tooltip: `${t('keepCost.freeEvery', card.cycleDays)} · ${how}` }
  const yearly = formatCNY(getPriceCNY(card, rates) / card.cycleDays * 365, 0)
  return {
    short: yearly,
    long: t('keepCost.perYear', { amount: yearly }),
    tooltip: `${t('keepCost.perCycle', { amount: formatAmount(card.price, card.currency), days: t('days.count', card.cycleDays) })} · ${how}`,
  }
}

export function formatAmount(amount: number, currency: string): string {
  const code = normalizeCurrency(currency)
  const symbol = CURRENCY_SYMBOLS[code]
  const digits = Math.abs(amount) >= 1000 || Number.isInteger(amount) ? 0 : 2
  return `${symbol}${formatNumber(amount, { minimumFractionDigits: digits, maximumFractionDigits: 2 })}`
}

export function formatCNY(amount: number, digits = 2): string {
  return `¥${formatNumber(amount, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`
}

/** Balance sufficiency for the next renewal; 100% when balance >= renewal price */
export function getBalanceInfo(card: SimCard): { text: string, percent: number, status: BarStatus, sub: string } {
  if (card.balance == null) {
    return { text: '-', percent: 0, status: 'default', sub: t('balance.none') }
  }
  const updatedDays = daysSince(card.balanceUpdatedAt)
  const sub = updatedDays === null
    ? t('balance.noUpdateDate')
    : updatedDays <= 0 ? t('balance.updatedToday') : t('balance.updatedDaysAgo', { days: t('days.count', updatedDays) })
  let percent = 100
  if (card.price > 0)
    percent = Math.max(0, Math.min(100, card.balance / card.price * 100))
  const status: BarStatus = percent >= 100 ? 'success' : percent >= 50 ? 'warning' : 'error'
  return { text: formatAmount(card.balance, card.currency), percent, status, sub }
}

export function isBalanceStale(card: SimCard): boolean {
  const days = daysSince(card.balanceUpdatedAt)
  return card.balance != null && days !== null && days > 90
}

/** Days held and percentage progress toward the next purchase anniversary */
export function getHoldInfo(card: SimCard): { days: number | null, percent: number, sub: string } {
  const days = daysSince(card.firstPurchaseAt)
  if (days === null || days < 0)
    return { days: null, percent: 0, sub: t('hold.noDate') }
  return {
    days,
    percent: (days % 365) / 365 * 100,
    sub: t('hold.since', { date: dayjs(card.firstPurchaseAt).format('YYYY-MM-DD') }),
  }
}

export function getPriceCNY(card: SimCard, rates: ExchangeRates): number {
  if (!card.price || card.price <= 0)
    return 0
  const code = normalizeCurrency(card.currency)
  if (code === 'CNY')
    return card.price
  return card.price / (rates[code] || 1)
}

export function shortTypeLabel(type: string): string {
  return type.replace(LEADING_ESIM_REGEX, '').trim() || type || t('card.uncategorized')
}

export function getNumberDisplay(card: SimCard): string {
  return card.number || card.numberMasked
}

export function statusText(status: CardStatus): string {
  return t(`status.${status}`)
}

export function sortCards(cards: SimCard[], mode: string): SimCard[] {
  const list = [...cards]
  switch (mode) {
    case 'manual':
      return list.sort((a, b) => a.order - b.order)
    case 'name':
      return list.sort((a, b) => compareText(a.name, b.name))
    case 'country':
      return list.sort((a, b) => compareText(countryName(a), countryName(b)) || compareText(a.name, b.name))
    case 'renewal':
    default:
      return list.sort((a, b) => {
        const da = getRenewalDays(a)
        const db = getRenewalDays(b)
        if (da === null && db === null)
          return a.order - b.order
        if (da === null)
          return 1
        if (db === null)
          return -1
        return da - db || a.order - b.order
      })
  }
}
