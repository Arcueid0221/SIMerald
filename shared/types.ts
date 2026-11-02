/**
 * SIMerald 前后端共用的数据类型。
 * 后端用 Node 原生的类型剥离直接运行，这里只能写类型（不能有 enum 等需要编译的语法）。
 */

export type CardStatus = 'active' | 'expired' | 'cancelled'

/** 卡片类型大类，决定图标 */
export type CardKind = 'physical' | 'adapter' | 'embedded' | 'virtual'

/** Notion select 选项颜色 */
export type NotionColor
  = | 'default' | 'gray' | 'brown' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'red'

export interface SimRecord {
  id: string
  /** 消费类型：首次购买/开卡、续费/保号、额外充值、其他费用 */
  type: string
  /** 消费日期 YYYY-MM-DD */
  date: string | null
  /** 支付金额（原币种） */
  amount: number | null
  /** 支付币种 ISO 代码 */
  currency: string
  /** 当时汇率：1 单位外币 = ? CNY */
  rate: number | null
  /** 等额人民币（Notion 公式算好的） */
  amountCNY: number | null
  /** 本次有效期延至 YYYY-MM-DD */
  extendsTo: string | null
  /** 仅登录后返回：记录标题 */
  title?: string
  /** 仅登录后返回：扣款账户名称 */
  accounts?: string[]
}

export interface SimCard {
  id: string
  /** 卡片名称，如 "Harbour Mobile · 0123" */
  name: string
  /** 运营商简称，如 "Harbour Mobile" */
  carrier: string
  /** 号码后 4 位 */
  last4: string
  /** 公开展示用的打码号码，如 "•••• 3575" */
  numberMasked: string
  /** 国旗 emoji，如 "🇪🇪"；没有时为空字符串 */
  region: string
  /** 国家/地区名称，如 "爱沙尼亚" */
  countryName: string
  /** 卡片类型原文 */
  type: string
  typeKind: CardKind
  typeColor: NotionColor
  /** 保号动作 */
  keepAlive: string[]
  /** 续费周期（天），不固定时为 0 */
  cycleDays: number
  /** 续费周期原文 */
  cycleLabel: string
  /** 续费金额 */
  price: number
  /** 续费币种 ISO 代码 */
  currency: string
  balance: number | null
  balanceUpdatedAt: string | null
  /** 当前有效期至 */
  expiresAt: string | null
  /** 下次续费日期（日期范围时为开始日期） */
  nextRenewalAt: string | null
  /** 下次续费日期为范围时的结束日期 */
  nextRenewalEnd: string | null
  /** 本期开始日期：设定当前有效期的那笔消费的日期 */
  periodStart: string | null
  status: CardStatus
  statusLabel: string
  cancelledAt: string | null
  firstPurchaseAt: string | null
  totalSpentCNY: number | null
  /** 续费紧急度原文，可用于排序 */
  urgency: string | null
  /** Notion 里的排列顺序 */
  order: number
  history: SimRecord[]
  /** 运营商 Logo 地址（数据目录 logos/ 里有对应文件时才有），由接口补上 */
  logo?: string | null
  // ===== 以下字段只在登录后返回 =====
  /** 主要使用设备 */
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
  /** 没有配置 Notion 时使用内置演示数据 */
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
  /** 同步成功但有部分内容被跳过时的提示 */
  lastWarning: string | null
  lastReason: string | null
  cardCount: number
  recordCount: number
  nextRunAt: string | null
}

export interface NotionSettingsView {
  tokenConfigured: boolean
  /** token 来自环境变量时，设置面板不能修改 */
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
