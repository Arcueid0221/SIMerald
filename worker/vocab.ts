import type { CardStatus, KeepAliveCode, RecordKind } from '../shared/types.ts'

/**
 * Label vocabularies understood in notes. Each entry lists the Chinese label first, then the English one;
 * the demo data uses the same order to show either language.
 */

export const KEEP_ALIVE_CODES: KeepAliveCode[] = ['topup', 'addon', 'use', 'balanceChange', 'autoCharge', 'plan']

export const STATUS_VALUES: Record<CardStatus, string[]> = {
  active: ['使用中', 'Active'],
  expired: ['已过期', 'Expired'],
  cancelled: ['已注销', 'Cancelled'],
}

export const RECORD_TYPES: Record<Exclude<RecordKind, 'other'>, string[]> = {
  purchase: ['首次购买/开卡', 'Initial purchase'],
  renewal: ['续费/保号', 'Renewal'],
  topup: ['额外充值', 'Extra top-up'],
}

export const KEEP_ALIVE_VALUES: Record<KeepAliveCode, string[]> = {
  topup: ['充值余额', 'Top up balance'],
  addon: ['购买/启用增值服务', 'Buy or enable an add-on'],
  use: ['有效使用（含收发短信）', 'Regular use (incl. SMS)'],
  balanceChange: ['产生余额变动（如发漫游短信）', 'Balance change (e.g. roaming SMS)'],
  autoCharge: ['自动扣费', 'Auto-charge'],
  plan: ['购买续费套餐', 'Buy a renewal plan'],
}

// Short labels people actually type in notes, checked after the exact vocabulary
const PURCHASE_KEYWORDS = ['首次', '开卡', '首购', 'purchase', 'activation', 'initial']
const RENEWAL_KEYWORDS = ['续费', '保号', 'renew']
const TOPUP_KEYWORDS = ['充值', 'top-up', 'top up', 'topup', 'recharge']

const KEEP_ALIVE_KEYWORDS: [KeepAliveCode, string[]][] = [
  ['autoCharge', ['自动扣费', 'auto']],
  ['plan', ['套餐', 'plan']],
  ['addon', ['增值', 'add-on', 'addon']],
  ['balanceChange', ['余额变动', '漫游短信', 'balance change']],
  ['use', ['有效使用', '使用', '短信', '流量', 'use', 'sms']],
  ['topup', ['充值', 'top up', 'top-up', 'topup']],
]

/** Maps a record type label to an internal kind: exact vocabulary first, then keywords in either language. */
export function resolveRecordKind(type: string): RecordKind {
  const text = type.trim()
  if (!text)
    return 'other'
  for (const kind of ['purchase', 'renewal', 'topup'] as const) {
    if (RECORD_TYPES[kind].includes(text))
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

/** Maps a keep-alive label to its code: exact vocabulary first (ignoring case), then keywords; null when unknown. */
export function resolveKeepAliveCode(label: string): KeepAliveCode | null {
  const text = label.trim().toLowerCase()
  if (!text)
    return null
  const exact = KEEP_ALIVE_CODES.find(code => KEEP_ALIVE_VALUES[code].some(v => v.toLowerCase() === text))
  if (exact)
    return exact
  return KEEP_ALIVE_KEYWORDS.find(([, words]) => words.some(w => text.includes(w)))?.[0] ?? null
}
