import type { CardKind, CardStatus, NotionColor, SimCard, SimRecord } from '../shared/types.ts'
import type { FieldMapping } from './mapping.ts'
import type { NotionPage } from './notion.ts'
import { createHmac } from 'node:crypto'
import { resolveRecordKind } from './mapping.ts'
import { findTitleProperty, propDate, propList, propNumber, propRelation, propSelect, propText } from './notion.ts'

/**
 * Converts Notion pages into full SimCard objects. Public API responses must pass through view.ts for redaction.
 */

const REGION_FLAG_REGEX = /[\u{1F1E6}-\u{1F1FF}]{2}/u
const CURRENCY_CODE_REGEX = /\b([A-Z]{3})\b/
const NUMBER_IN_TEXT_REGEX = /(\d+)/
const NON_DIGIT_REGEX = /\D/g
const NAME_SEPARATOR_REGEX = /\s*[·•|]\s*/
const LEADING_ESIM_REGEX = /^eSIM\s*[·•]\s*/i
const DATE_PREFIX_REGEX = /^\d{4}-\d{2}-\d{2}/
const NOTION_COLORS = new Set(['default', 'gray', 'brown', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'red'])

export function parseCurrency(text: string | null): string {
  if (!text)
    return 'CNY'
  const match = text.toUpperCase().match(CURRENCY_CODE_REGEX)
  return match?.[1] ?? 'CNY'
}

export function parseCycleDays(text: string | null): number {
  if (!text)
    return 0
  const match = text.match(NUMBER_IN_TEXT_REGEX)
  return match ? Number(match[1]) : 0
}

export function parseCountry(text: string | null): { region: string, name: string } {
  if (!text)
    return { region: '', name: '' }
  const flag = text.match(REGION_FLAG_REGEX)?.[0] ?? ''
  const name = text.replace(REGION_FLAG_REGEX, '').trim()
  return { region: flag, name: name || text.trim() }
}

export function detectKind(type: string): CardKind {
  const lower = type.toLowerCase()
  if (lower.includes('虚拟') || lower.includes('virtual') || lower.includes('app'))
    return 'virtual'
  if (lower.includes('实体') || lower.includes('physical'))
    return 'physical'
  if (lower.includes('卡托') || lower.includes('adapter') || lower.includes('estk') || lower.includes('euicc'))
    return 'adapter'
  if (lower.includes('esim'))
    return 'embedded'
  return 'physical'
}

export function shortTypeLabel(type: string): string {
  return type.replace(LEADING_ESIM_REGEX, '').trim() || type
}

function toDate(value: string | null | undefined): string | null {
  if (!value)
    return null
  const match = value.match(DATE_PREFIX_REGEX)
  return match ? match[0] : null
}

function todayKey(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function resolveStatus(statusText: string | null, mapping: FieldMapping, cancelledAt: string | null, expiresAt: string | null): CardStatus {
  if (statusText) {
    if (mapping.statusValues.cancelled.includes(statusText))
      return 'cancelled'
    if (mapping.statusValues.expired.includes(statusText))
      return 'expired'
    if (mapping.statusValues.active.includes(statusText))
      return 'active'
  }
  if (cancelledAt)
    return 'cancelled'
  if (expiresAt && expiresAt < todayKey())
    return 'expired'
  return 'active'
}

const STATUS_LABELS: Record<CardStatus, string> = {
  active: '使用中',
  expired: '已过期',
  cancelled: '已注销',
}

/** Derives a stable, non-reversible public ID by HMAC-hashing the Notion page ID with the site secret. */
export function opaqueId(notionId: string, idKey: string): string {
  return createHmac('sha256', idKey).update(notionId).digest('hex').slice(0, 16)
}

export function buildRecord(page: NotionPage, mapping: FieldMapping, accountNames: Map<string, string>, idKey: string): SimRecord & { cardId: string | null } {
  const p = page.properties
  const f = mapping.records
  const titleProp = p[f.title] ?? findTitleProperty(page)
  const type = propText(p[f.type]) ?? ''
  return {
    id: opaqueId(page.id, idKey),
    cardId: propRelation(p[f.card])[0] ?? null,
    title: propText(titleProp) ?? '',
    type,
    kind: resolveRecordKind(type, mapping),
    date: toDate(propDate(p[f.date])?.start),
    amount: propNumber(p[f.amount]),
    currency: parseCurrency(propText(p[f.currency])),
    rate: propNumber(p[f.rate]),
    amountCNY: propNumber(p[f.amountCNY]),
    extendsTo: toDate(propDate(p[f.extendsTo])?.start),
    accounts: propRelation(p[f.accounts]).map(id => accountNames.get(id) ?? '').filter(Boolean),
  }
}

export function buildCards(
  cardPages: NotionPage[],
  recordPages: NotionPage[],
  mapping: FieldMapping,
  accountNames: Map<string, string>,
  idKey: string,
): { cards: SimCard[], recordCount: number } {
  const records = recordPages.map(page => buildRecord(page, mapping, accountNames, idKey))
  const recordsByCard = new Map<string, SimRecord[]>()
  for (const { cardId, ...record } of records) {
    if (!cardId)
      continue
    const list = recordsByCard.get(cardId) ?? []
    list.push(record)
    recordsByCard.set(cardId, list)
  }

  const f = mapping.cards
  const cards = cardPages.map((page, index): SimCard => {
    const p = page.properties
    const name = propText(p[f.name] ?? findTitleProperty(page)) ?? '未命名'
    const number = propText(p[f.number])
    const digits = (number ?? '').replace(NON_DIGIT_REGEX, '')
    const nameParts = name.split(NAME_SEPARATOR_REGEX)
    const last4 = digits.length >= 4 ? digits.slice(-4) : (nameParts[1] ?? '').replace(NON_DIGIT_REGEX, '').slice(-4)
    const typeSelect = propSelect(p[f.type])
    const type = typeSelect?.name ?? ''
    const country = parseCountry(propText(p[f.country]))
    const cycleLabel = propText(p[f.cycle]) ?? ''
    const expiresAt = toDate(propDate(p[f.expiresAt])?.start)
    const override = propDate(p[f.nextRenewalOverride])
    const nextRenewal = propDate(p[f.nextRenewal])
    const nextRenewalAt = toDate(nextRenewal?.start) ?? toDate(override?.start) ?? expiresAt
    const nextRenewalEnd = toDate(nextRenewal?.end) ?? toDate(override?.end)
    const cancelledAt = toDate(propDate(p[f.cancelledAt])?.start)
    const statusText = propText(p[f.status])
    const status = resolveStatus(statusText, mapping, cancelledAt, expiresAt)

    const history = (recordsByCard.get(page.id) ?? [])
      .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || (b.extendsTo ?? '').localeCompare(a.extendsTo ?? ''))
    const periodRecord = history.find(r => r.extendsTo && r.date)
    const firstPurchase = toDate(propDate(p[f.firstPurchaseAt])?.start)
      ?? [...history].reverse().find(r => r.date)?.date
      ?? null
    const recordSpend = history.reduce((sum, r) => sum + (r.amountCNY ?? 0), 0)
    const color = typeSelect?.color && NOTION_COLORS.has(typeSelect.color) ? typeSelect.color as NotionColor : 'default'

    return {
      id: opaqueId(page.id, idKey),
      name,
      carrier: nameParts[0]?.trim() || name,
      last4,
      numberMasked: last4 ? `•••• ${last4}` : '••••',
      region: country.region,
      countryName: country.name,
      type,
      typeKind: detectKind(type),
      typeColor: color,
      device: propText(p[f.device]),
      keepAlive: propList(p[f.keepAlive]),
      cycleDays: parseCycleDays(cycleLabel),
      cycleLabel,
      price: propNumber(p[f.price]) ?? 0,
      currency: parseCurrency(propText(p[f.currency])),
      balance: propNumber(p[f.balance]),
      balanceUpdatedAt: toDate(propDate(p[f.balanceUpdatedAt])?.start),
      expiresAt,
      nextRenewalAt: status === 'cancelled' ? null : nextRenewalAt,
      nextRenewalEnd: status === 'cancelled' ? null : nextRenewalEnd,
      periodStart: periodRecord?.date ?? null,
      status,
      statusLabel: statusText ?? STATUS_LABELS[status],
      cancelledAt,
      firstPurchaseAt: firstPurchase,
      totalSpentCNY: propNumber(p[f.totalSpentCNY]) ?? (history.length ? Math.round(recordSpend * 100) / 100 : null),
      urgency: propText(p[f.urgency]),
      order: index,
      history,
      number,
      services: propList(p[f.services]),
      account: propText(p[f.account]),
      paymentAccounts: propRelation(p[f.paymentAccounts]).map(id => accountNames.get(id) ?? '').filter(Boolean),
      dataCheck: propText(p[f.dataCheck]),
      notionUrl: page.url,
    }
  })

  return { cards, recordCount: records.length }
}

export function collectAccountNames(pages: NotionPage[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const page of pages) {
    const title = propText(findTitleProperty(page))
    if (title)
      map.set(page.id, title)
  }
  return map
}
