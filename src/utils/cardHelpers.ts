import type { CardStatus, SimCard, SimRecord } from '@shared/types'
import type { ExchangeRates } from '@/utils/financeHelper'
import dayjs from 'dayjs'
import { CURRENCY_SYMBOLS, normalizeCurrency } from '@/utils/financeHelper'

/** 和 Emerald 一致的到期阈值：7 天内红色，15 天内黄色 */
const CRITICAL_DAYS = 7
const WARNING_DAYS = 15
const LONG_TERM_DAYS = 36500
const LEADING_ESIM_REGEX = /^eSIM\s*[·•]\s*/i

export type RenewalState = 'overdue' | 'critical' | 'warning' | 'normal' | 'long_term' | 'none'
export type BarStatus = 'default' | 'success' | 'warning' | 'error' | 'info'

function today() {
  return dayjs().startOf('day')
}

/** 距离某个日期还有几天（按自然日算），日期为空返回 null */
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

/** 有效期分档：按「本期还剩几成」算，每张卡只和自己的续费周期比 */
export type ValidityTone = 'critical' | 'urgent' | 'warning' | 'fair' | 'good' | 'none'

/** 各档的文字颜色；圆环和横条用 currentColor 跟着它走 */
export const VALIDITY_TONE_TEXT: Record<ValidityTone, string> = {
  critical: 'text-destructive',
  urgent: 'text-orange-500',
  warning: 'text-warning',
  fair: 'text-lime-500',
  good: 'text-success',
  none: 'text-muted-foreground/40',
}

export interface ValidityInfo {
  /** 距离有效期末还有几天；没有有效期记录或已注销时为 null */
  left: number | null
  /** 本期总天数：本期开始日到有效期末 */
  total: number
  /** 本期还剩几成，0 ~ 1 */
  ratio: number
  tone: ValidityTone
  /** 剩得不到一半时，天数跟着变色 */
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

/** 剩余天数的数字部分（单位「天」由界面补上） */
export function getValidityDaysText(validity: ValidityInfo): string {
  if (validity.left === null)
    return '-'
  return validity.left < 0 ? `过期 ${-validity.left}` : String(validity.left)
}

export function getValidityTooltip(card: SimCard, validity: ValidityInfo): string {
  if (card.status === 'cancelled')
    return card.cancelledAt ? `${card.cancelledAt} 注销` : '已注销'
  if (validity.left === null)
    return '没有有效期记录'
  const end = card.expiresAt ?? card.nextRenewalAt
  return `本期 ${validity.total} 天，还剩 ${Math.max(validity.left, 0)} 天 · 至 ${end}`
}

export function isPurchaseRecord(record: SimRecord): boolean {
  return record.type.includes('首次') || record.type.includes('开卡')
}

export interface PurchaseInfo {
  /** 首次购买那笔的人民币金额 */
  cny: number | null
  /** 原币种金额，如 €4.14 */
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
  /** 卡片上的短写法：¥243 / 免费 / 不固定 */
  short: string
  /** 带单位的写法：¥243/年 / 免费保号 / 周期不固定 */
  long: string
  /** 悬停提示：原币种续费价 + 保号方式 */
  tooltip: string
}

/** 每年保号花多少钱（人民币估算）；已注销的卡也照常算，界面上会盖住 */
export function getKeepCost(card: SimCard, rates: ExchangeRates): KeepCostInfo {
  const how = card.keepAlive.join('、') || '未记录保号方式'
  if (card.cycleDays <= 0)
    return { short: '不固定', long: '周期不固定', tooltip: `周期不固定 · ${how}` }
  if (card.price <= 0)
    return { short: '免费', long: '免费保号', tooltip: `每 ${card.cycleDays} 天免费 · ${how}` }
  const yearly = formatCNY(getPriceCNY(card, rates) / card.cycleDays * 365, 0)
  return {
    short: yearly,
    long: `${yearly}/年`,
    tooltip: `${formatAmount(card.price, card.currency)} / ${card.cycleDays} 天 · ${how}`,
  }
}

export function getRenewalDaysText(card: SimCard): string {
  if (card.status === 'cancelled')
    return '已注销'
  const days = getRenewalDays(card)
  if (days === null)
    return '-'
  if (days < 0)
    return `过期 ${-days} 天`
  if (days === 0)
    return '今天'
  return `${days} 天`
}

export function formatAmount(amount: number, currency: string): string {
  const code = normalizeCurrency(currency)
  const symbol = CURRENCY_SYMBOLS[code]
  const digits = Math.abs(amount) >= 1000 || Number.isInteger(amount) ? 0 : 2
  return `${symbol}${new Intl.NumberFormat('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: 2 }).format(amount)}`
}

export function formatCNY(amount: number, digits = 2): string {
  return `¥${new Intl.NumberFormat('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(amount)}`
}

/** 余额够不够下一次保号：余额 ≥ 续费金额记 100% */
export function getBalanceInfo(card: SimCard): { text: string, percent: number, status: BarStatus, sub: string } {
  if (card.balance === null) {
    return { text: '-', percent: 0, status: 'default', sub: '未记录余额' }
  }
  const updatedDays = daysSince(card.balanceUpdatedAt)
  const sub = updatedDays === null
    ? '未记录更新时间'
    : updatedDays <= 0 ? '今天更新' : `${updatedDays} 天前更新`
  let percent = 100
  if (card.price > 0)
    percent = Math.max(0, Math.min(100, card.balance / card.price * 100))
  const status: BarStatus = percent >= 100 ? 'success' : percent >= 50 ? 'warning' : 'error'
  return { text: formatAmount(card.balance, card.currency), percent, status, sub }
}

export function isBalanceStale(card: SimCard): boolean {
  const days = daysSince(card.balanceUpdatedAt)
  return card.balance !== null && days !== null && days > 90
}

/** 持有天数，以及距离下一个入手周年的进度 */
export function getHoldInfo(card: SimCard): { days: number | null, percent: number, sub: string } {
  const days = daysSince(card.firstPurchaseAt)
  if (days === null || days < 0)
    return { days: null, percent: 0, sub: '未记录入手日期' }
  return {
    days,
    percent: (days % 365) / 365 * 100,
    sub: `${dayjs(card.firstPurchaseAt).format('YYYY-MM-DD')} 入手`,
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
  return type.replace(LEADING_ESIM_REGEX, '').trim() || type || '未分类'
}

export function getNumberDisplay(card: SimCard): string {
  return card.number || card.numberMasked
}

export function statusText(status: CardStatus): string {
  return status === 'active' ? '使用中' : status === 'expired' ? '已过期' : '已注销'
}

export function sortCards(cards: SimCard[], mode: string): SimCard[] {
  const list = [...cards]
  switch (mode) {
    case 'notion':
      return list.sort((a, b) => a.order - b.order)
    case 'name':
      return list.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
    case 'country':
      return list.sort((a, b) => a.countryName.localeCompare(b.countryName, 'zh-CN') || a.name.localeCompare(b.name, 'zh-CN'))
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
