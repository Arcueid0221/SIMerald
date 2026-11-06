/**
 * Notion column name mapping.
 *
 * Two built-in presets match the official Chinese and English Notion templates
 * (see scripts/notion-template/template.ts). A custom JSON mapping can be layered on top of the
 * Chinese preset in the settings panel for databases with other column names.
 */

import type { KeepAliveCode, RecordKind } from '../shared/types.ts'

export type MappingPreset = 'zh' | 'en'
export type PresetChoice = MappingPreset | 'custom'

export const PRESET_CHOICES: PresetChoice[] = ['zh', 'en', 'custom']

export interface FieldMapping {
  cards: {
    name: string
    number: string
    country: string
    type: string
    device: string
    keepAlive: string
    cycle: string
    price: string
    currency: string
    balance: string
    balanceUpdatedAt: string
    expiresAt: string
    nextRenewal: string
    nextRenewalOverride: string
    status: string
    cancelledAt: string
    firstPurchaseAt: string
    totalSpentCNY: string
    urgency: string
    services: string
    account: string
    paymentAccounts: string
    dataCheck: string
  }
  records: {
    title: string
    card: string
    type: string
    date: string
    amount: string
    currency: string
    rate: string
    amountCNY: string
    extendsTo: string
    accounts: string
  }
  /** Maps status property values to internal card statuses. */
  statusValues: {
    active: string[]
    expired: string[]
    cancelled: string[]
  }
  /** Maps expense record type values to internal record kinds; anything unmatched is `other`. */
  recordTypes: {
    purchase: string[]
    renewal: string[]
    topup: string[]
  }
  /** Maps keep-alive option values to codes the UI can translate; unmatched labels are shown as written. */
  keepAliveValues: Record<KeepAliveCode, string[]>
}

export const KEEP_ALIVE_CODES: KeepAliveCode[] = ['topup', 'addon', 'use', 'balanceChange', 'autoCharge', 'plan']

// Value vocabularies accept both template languages, so a preset still works if a user mixes them
export const STATUS_VALUES: FieldMapping['statusValues'] = {
  active: ['使用中', 'Active'],
  expired: ['已过期', 'Expired'],
  cancelled: ['已注销', 'Cancelled'],
}

export const RECORD_TYPES: FieldMapping['recordTypes'] = {
  purchase: ['首次购买/开卡', 'Initial purchase'],
  renewal: ['续费/保号', 'Renewal'],
  topup: ['额外充值', 'Extra top-up'],
}

export const KEEP_ALIVE_VALUES: FieldMapping['keepAliveValues'] = {
  topup: ['充值余额', 'Top up balance'],
  addon: ['购买/启用增值服务', 'Buy or enable an add-on'],
  use: ['有效使用（含收发短信）', 'Regular use (incl. SMS)'],
  balanceChange: ['产生余额变动（如发漫游短信）', 'Balance change (e.g. roaming SMS)'],
  autoCharge: ['自动扣费', 'Auto-charge'],
  plan: ['购买续费套餐', 'Buy a renewal plan'],
}

export const PRESETS: Record<MappingPreset, FieldMapping> = {
  zh: {
    cards: {
      name: '卡片名称',
      number: '号码',
      country: '号码国家',
      type: '卡片类型',
      device: '主要使用设备',
      keepAlive: '保号动作',
      cycle: '续费周期',
      price: '续费金额',
      currency: '续费币种',
      balance: '当前余额',
      balanceUpdatedAt: '余额更新日期',
      expiresAt: '当前有效期至',
      nextRenewal: '下次续费日期',
      nextRenewalOverride: '下次续费日期（手动覆盖）',
      status: '号码状态',
      cancelledAt: '停用日期',
      firstPurchaseAt: '首次购买日期',
      totalSpentCNY: '卡消费合计 CNY',
      urgency: '续费紧急度',
      services: '绑定的服务',
      account: '管理账号',
      paymentAccounts: '默认扣款账户',
      dataCheck: '⚠️ 数据检查',
    },
    records: {
      title: '记录',
      card: 'SIM 卡',
      type: '消费类型',
      date: '消费日期',
      amount: '支付金额',
      currency: '货币',
      rate: '当时汇率',
      amountCNY: '等额 CNY',
      extendsTo: '本次有效期延至',
      accounts: '扣款账户',
    },
    statusValues: STATUS_VALUES,
    recordTypes: RECORD_TYPES,
    keepAliveValues: KEEP_ALIVE_VALUES,
  },
  en: {
    cards: {
      name: 'Card Name',
      number: 'Number',
      country: 'Country',
      type: 'Card Type',
      device: 'Device',
      keepAlive: 'Keep-alive Actions',
      cycle: 'Renewal Cycle',
      price: 'Renewal Price',
      currency: 'Renewal Currency',
      balance: 'Balance',
      balanceUpdatedAt: 'Balance Checked',
      expiresAt: 'Valid Until',
      nextRenewal: 'Next Renewal',
      nextRenewalOverride: 'Next Renewal Override',
      status: 'Status',
      cancelledAt: 'Cancelled On',
      firstPurchaseAt: 'First Purchase',
      totalSpentCNY: 'Total Spent CNY',
      urgency: 'Urgency',
      services: 'Linked Services',
      account: 'Account Login',
      paymentAccounts: 'Default Payment Account',
      dataCheck: '⚠️ Data Check',
    },
    records: {
      title: 'Record',
      card: 'SIM Card',
      type: 'Type',
      date: 'Date',
      amount: 'Amount',
      currency: 'Currency',
      rate: 'Rate to CNY',
      amountCNY: 'Amount CNY',
      extendsTo: 'Extends To',
      accounts: 'Payment Account',
    },
    statusValues: STATUS_VALUES,
    recordTypes: RECORD_TYPES,
    keepAliveValues: KEEP_ALIVE_VALUES,
  },
}

/** Base for custom mappings and the default for existing installations. */
export const DEFAULT_MAPPING: FieldMapping = PRESETS.zh

export function isPresetChoice(value: unknown): value is PresetChoice {
  return typeof value === 'string' && (PRESET_CHOICES as string[]).includes(value)
}

function clone(mapping: FieldMapping): FieldMapping {
  return JSON.parse(JSON.stringify(mapping))
}

function stringList(value: unknown): string[] | null {
  return Array.isArray(value) && value.every(v => typeof v === 'string') ? value as string[] : null
}

/** Merges user-supplied JSON into a base mapping, ignoring unknown keys and values of the wrong type. */
export function mergeMapping(input: unknown, base: FieldMapping = DEFAULT_MAPPING): FieldMapping {
  const result = clone(base)
  if (!input || typeof input !== 'object')
    return result
  const source = input as Record<string, Record<string, unknown>>

  for (const section of ['cards', 'records'] as const) {
    const custom = source[section]
    if (!custom || typeof custom !== 'object')
      continue
    const target = result[section] as Record<string, string>
    for (const key of Object.keys(target)) {
      const value = custom[key]
      if (typeof value === 'string')
        target[key] = value.trim()
    }
  }

  const status = source.statusValues
  if (status && typeof status === 'object') {
    for (const key of ['active', 'expired', 'cancelled'] as const) {
      const list = stringList(status[key])
      if (list)
        result.statusValues[key] = list
    }
  }

  const types = source.recordTypes
  if (types && typeof types === 'object') {
    for (const key of ['purchase', 'renewal', 'topup'] as const) {
      const list = stringList(types[key])
      if (list)
        result.recordTypes[key] = list
    }
  }

  const keepAlive = source.keepAliveValues
  if (keepAlive && typeof keepAlive === 'object') {
    for (const key of KEEP_ALIVE_CODES) {
      const list = stringList(keepAlive[key])
      if (list)
        result.keepAliveValues[key] = list
    }
  }
  return result
}

export function parseMappingText(text: string): FieldMapping {
  if (!text.trim())
    return mergeMapping(null)
  return mergeMapping(JSON.parse(text))
}

/** Resolves the effective mapping for a preset choice; `custom` layers the JSON text on top of the Chinese preset. */
export function resolveMapping(choice: PresetChoice, customText: string): FieldMapping {
  if (choice === 'custom')
    return parseMappingText(customText)
  return clone(PRESETS[choice])
}

// Fallback keywords for record types that are not listed in `recordTypes` (custom databases, renamed options)
const PURCHASE_KEYWORDS = ['首次', '开卡', '首购', 'purchase', 'activation', 'initial']
const RENEWAL_KEYWORDS = ['续费', '保号', 'renew']
const TOPUP_KEYWORDS = ['充值', 'top-up', 'top up', 'topup', 'recharge']

/** Maps an expense record type label to an internal kind: exact preset values first, then keywords in either language. */
export function resolveRecordKind(type: string, mapping: FieldMapping): RecordKind {
  const text = type.trim()
  if (!text)
    return 'other'
  for (const kind of ['purchase', 'renewal', 'topup'] as const) {
    if (mapping.recordTypes[kind].includes(text))
      return kind
  }
  const lower = text.toLowerCase()
  if (PURCHASE_KEYWORDS.some(k => lower.includes(k)))
    return 'purchase'
  if (RENEWAL_KEYWORDS.some(k => lower.includes(k)))
    return 'renewal'
  if (TOPUP_KEYWORDS.some(k => lower.includes(k)))
    return 'topup'
  return 'other'
}

/** Maps a keep-alive label to its code by exact match (ignoring case), or null for labels outside the vocabulary. */
export function resolveKeepAliveCode(label: string, mapping: FieldMapping): KeepAliveCode | null {
  const text = label.trim().toLowerCase()
  if (!text)
    return null
  return KEEP_ALIVE_CODES.find(code => mapping.keepAliveValues[code].some(v => v.trim().toLowerCase() === text)) ?? null
}
