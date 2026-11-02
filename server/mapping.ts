/**
 * Notion 字段名映射。默认值对应作者自己的 Notion 模板；
 * 别人的数据库字段名不同，可以在设置面板里改这份 JSON。
 */

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
  /** 号码状态公式的取值 → 状态 */
  statusValues: {
    active: string[]
    expired: string[]
    cancelled: string[]
  }
}

export const DEFAULT_MAPPING: FieldMapping = {
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
  statusValues: {
    active: ['使用中'],
    expired: ['已过期'],
    cancelled: ['已注销'],
  },
}

/** 把用户填的 JSON 和默认值合并；只接受字符串（或状态值的字符串数组），其他一律忽略 */
export function mergeMapping(input: unknown): FieldMapping {
  const result: FieldMapping = JSON.parse(JSON.stringify(DEFAULT_MAPPING))
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
      const value = status[key]
      if (Array.isArray(value) && value.every(v => typeof v === 'string'))
        result.statusValues[key] = value as string[]
    }
  }
  return result
}

export function parseMappingText(text: string): FieldMapping {
  if (!text.trim())
    return mergeMapping(null)
  return mergeMapping(JSON.parse(text))
}
