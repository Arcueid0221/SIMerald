import type { CardStatus, SimCard } from '@shared/types'
import type { ExchangeRates } from '@/utils/financeHelper'
import dayjs from 'dayjs'
import { CURRENCY_SYMBOLS, normalizeCurrency } from '@/utils/financeHelper'
import { formatPriceWithCycle } from '@/utils/tagHelper'

/** 和 Emerald 一致的到期阈值：7 天内红色，15 天内黄色 */
const CRITICAL_DAYS = 7
const WARNING_DAYS = 15
const LONG_TERM_DAYS = 36500
const LEADING_ESIM_REGEX = /^eSIM\s*[·•]\s*/i

export type RenewalState = 'overdue' | 'critical' | 'warning' | 'normal' | 'long_term' | 'none'
export type BarStatus = 'default' | 'success' | 'warning' | 'error' | 'info'

export interface PriceTagItem {
  text: string
  highlight?: boolean
}

export interface MonthBar {
  key: string
  className: string
  tooltip: string
  active: boolean
}

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

export function getRenewalBarStatus(card: SimCard): BarStatus {
  const state = getRenewalState(card)
  if (state === 'overdue' || state === 'critical')
    return 'error'
  if (state === 'warning')
    return 'warning'
  if (state === 'none')
    return 'default'
  return 'success'
}

/** 本期有效期还剩多少（百分比） */
export function getValidityPercent(card: SimCard): number {
  const end = card.nextRenewalAt ?? card.expiresAt
  if (card.status === 'cancelled' || !end)
    return 0
  const endDay = dayjs(end).startOf('day')
  const start = card.periodStart
    ? dayjs(card.periodStart).startOf('day')
    : endDay.subtract(card.cycleDays || 365, 'day')
  const total = Math.max(endDay.diff(start, 'day'), 1)
  const left = endDay.diff(today(), 'day')
  return Math.max(0, Math.min(100, left / total * 100))
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

/** 折合每年的保号成本（人民币） */
export function getAnnualCostCNY(card: SimCard, rates: ExchangeRates): number {
  if (card.status === 'cancelled' || card.cycleDays <= 0)
    return 0
  return getPriceCNY(card, rates) / card.cycleDays * 365
}

export function getPriceTags(card: SimCard): PriceTagItem[] {
  if (card.status === 'cancelled')
    return [{ text: '已注销' }]
  const tags: PriceTagItem[] = []
  if (card.price > 0)
    tags.push({ text: card.cycleDays > 0 ? formatPriceWithCycle(card.price, card.cycleDays, card.currency) : formatAmount(card.price, card.currency) })
  else
    tags.push({ text: '免费保号' })
  const days = getRenewalDays(card)
  if (days !== null) {
    if (days > LONG_TERM_DAYS)
      tags.push({ text: '长期' })
    else
      tags.push({ text: `${days >= 0 ? '+' : ''}${days}天`, highlight: true })
  }
  return tags
}

export function getRenewalTooltip(card: SimCard): string {
  if (card.status === 'cancelled')
    return card.cancelledAt ? `${card.cancelledAt} 注销` : '已注销'
  const date = card.nextRenewalAt ?? card.expiresAt
  if (!date)
    return '没有有效期记录'
  return card.nextRenewalEnd ? `续费窗口 ${date} ~ ${card.nextRenewalEnd}` : `下次续费 ${date}`
}

export function shortTypeLabel(type: string): string {
  return type.replace(LEADING_ESIM_REGEX, '').trim() || type || '未分类'
}

export function getNumberDisplay(card: SimCard): string {
  return card.number || card.numberMasked
}

export function getCardTags(card: SimCard): string[] {
  const tags: string[] = []
  if (card.device)
    tags.push(card.device)
  if (card.price === 0 && card.status !== 'cancelled')
    tags.push('免费保号')
  for (const service of card.services ?? [])
    tags.push(service)
  return tags
}

export function isFreeCard(card: SimCard): boolean {
  return !card.price || card.price <= 0
}

/** 过去 12 个月每月有没有花钱 */
export function getHistoryBars(card: SimCard, months = 12): MonthBar[] {
  const start = today().startOf('month').subtract(months - 1, 'month')
  const totals = new Map<string, { cny: number, count: number }>()
  for (const record of card.history) {
    if (!record.date)
      continue
    const key = dayjs(record.date).format('YYYY-MM')
    const entry = totals.get(key) ?? { cny: 0, count: 0 }
    entry.cny += record.amountCNY ?? 0
    entry.count += 1
    totals.set(key, entry)
  }
  return Array.from({ length: months }, (_, index) => {
    const month = start.add(index, 'month')
    const key = month.format('YYYY-MM')
    const entry = totals.get(key)
    return {
      key,
      active: !!entry,
      className: entry ? 'bg-emerald-600/90' : 'bg-muted-foreground/15',
      tooltip: entry ? `${key}\n${entry.count} 笔 · ${formatCNY(entry.cny)}` : `${key}\n无消费`,
    }
  })
}

/** 未来 12 个月里哪些月份要续费 */
export function getPlanBars(card: SimCard, months = 12): MonthBar[] {
  const start = today().startOf('month')
  const end = start.add(months, 'month')
  const due = new Map<string, string>()
  const first = card.status === 'cancelled' ? null : card.nextRenewalAt ?? card.expiresAt
  if (first) {
    let date = dayjs(first)
    // 已经过期的卡，把「本月」标成要续费
    if (date.isBefore(start))
      date = today()
    let guard = 0
    while (date.isBefore(end) && guard++ < 400) {
      due.set(date.format('YYYY-MM'), date.format('YYYY-MM-DD'))
      if (card.cycleDays <= 0)
        break
      date = date.add(card.cycleDays, 'day')
    }
  }
  const renewalDays = getRenewalDays(card)
  return Array.from({ length: months }, (_, index) => {
    const month = start.add(index, 'month')
    const key = month.format('YYYY-MM')
    const date = due.get(key)
    let className = 'bg-muted-foreground/15'
    if (date) {
      const isNext = index === 0 || date === (card.nextRenewalAt ?? card.expiresAt)
      if (isNext && renewalDays !== null && renewalDays < CRITICAL_DAYS)
        className = 'bg-rose-500/80'
      else if (isNext && renewalDays !== null && renewalDays < WARNING_DAYS)
        className = 'bg-yellow-400/80'
      else
        className = 'bg-emerald-600/90'
    }
    const priceText = card.price > 0 ? formatAmount(card.price, card.currency) : '免费'
    return {
      key,
      active: !!date,
      className,
      tooltip: date ? `${date}\n预计 ${priceText}` : `${key}\n无需续费`,
    }
  })
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
