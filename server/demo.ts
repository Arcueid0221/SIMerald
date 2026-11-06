import type { CardKind, CardStatus, NotionColor, SimCard, SimRecord } from '../shared/types.ts'

/**
 * Demo data shown when Notion is not configured. Uses fictional carriers and numbers
 * with dates computed relative to today so the demo always looks active.
 */

interface DemoSpec {
  carrier: string
  number: string
  region: string
  country: string
  type: string
  kind: CardKind
  color: NotionColor
  device: string | null
  keepAlive: string[]
  cycleDays: number
  price: number
  currency: string
  purchasePrice: number
  balance: number | null
  firstAgo: number
  status?: CardStatus
  services: string[]
}

const RATES: Record<string, number> = {
  CNY: 1,
  HKD: 0.91,
  USD: 7.1,
  GBP: 9.3,
  EUR: 7.8,
  JPY: 0.047,
  AUD: 4.7,
  SGD: 5.4,
  THB: 0.21,
  CAD: 5.1,
  KRW: 0.0052,
  NZD: 4.2,
}

const SPECS: DemoSpec[] = [
  { carrier: 'Harbour Mobile', number: '+85255550123', region: '🇭🇰', country: '中国香港', type: 'Physical SIM', kind: 'physical', color: 'brown', device: '主力机', keepAlive: ['充值余额'], cycleDays: 365, price: 18, currency: 'HKD', purchasePrice: 48, balance: 32, firstAgo: 420, services: ['Telegram', 'WhatsApp'] },
  { carrier: 'Orchid Tel', number: '+85255550456', region: '🇭🇰', country: '中国香港', type: 'eSIM · 直写手机', kind: 'embedded', color: 'blue', device: '备用机', keepAlive: ['购买/启用增值服务'], cycleDays: 365, price: 15, currency: 'HKD', purchasePrice: 58, balance: null, firstAgo: 260, services: ['Apple ID'] },
  { carrier: 'Sakura Tel', number: '+817055550789', region: '🇯🇵', country: '日本', type: 'eSIM · 直写手机', kind: 'embedded', color: 'blue', device: '主力机', keepAlive: ['购买续费套餐'], cycleDays: 365, price: 4800, currency: 'JPY', purchasePrice: 4800, balance: null, firstAgo: 200, services: ['Telegram'] },
  { carrier: 'Thames Mobile', number: '+447700900321', region: '🇬🇧', country: '英国', type: 'eSIM · 卡托', kind: 'adapter', color: 'purple', device: '卡托 A', keepAlive: ['产生余额变动（如发漫游短信）'], cycleDays: 180, price: 0.3, currency: 'GBP', purchasePrice: 5, balance: 4.2, firstAgo: 150, services: ['WhatsApp'] },
  { carrier: 'Lumen Wireless', number: '+12025550142', region: '🇺🇸', country: '美国', type: 'Physical SIM', kind: 'physical', color: 'brown', device: '备用机', keepAlive: ['自动扣费'], cycleDays: 30, price: 3, currency: 'USD', purchasePrice: 10, balance: null, firstAgo: 95, services: ['Telegram', 'Google'] },
  { carrier: 'Maple Talk', number: '+14165550198', region: '🇨🇦', country: '加拿大', type: '虚拟号码（仅 App）', kind: 'virtual', color: 'gray', device: null, keepAlive: ['购买续费套餐'], cycleDays: 90, price: 1.5, currency: 'USD', purchasePrice: 1, balance: null, firstAgo: 120, services: [] },
  { carrier: 'Rhein Mobil', number: '+4915155550147', region: '🇩🇪', country: '德国', type: 'eSIM · 卡托', kind: 'adapter', color: 'purple', device: '卡托 A', keepAlive: ['充值余额'], cycleDays: 365, price: 5, currency: 'EUR', purchasePrice: 9.9, balance: 7.5, firstAgo: 330, services: ['WhatsApp'] },
  { carrier: 'Fjord Telecom', number: '+3725555012', region: '🇪🇪', country: '爱沙尼亚', type: 'eSIM · 卡托', kind: 'adapter', color: 'purple', device: '卡托 B', keepAlive: ['有效使用（含收发短信）'], cycleDays: 365, price: 0, currency: 'EUR', purchasePrice: 4.5, balance: 1, firstAgo: 60, services: [] },
  { carrier: 'Merlion Mobile', number: '+6585550133', region: '🇸🇬', country: '新加坡', type: 'eSIM · 直写手机', kind: 'embedded', color: 'blue', device: '主力机', keepAlive: ['充值余额'], cycleDays: 120, price: 10, currency: 'SGD', purchasePrice: 15, balance: 12, firstAgo: 230, services: ['Telegram'] },
  { carrier: 'Lotus Mobile', number: '+66855550177', region: '🇹🇭', country: '泰国', type: 'Physical SIM', kind: 'physical', color: 'brown', device: '卡托 B', keepAlive: ['充值余额'], cycleDays: 30, price: 20, currency: 'THB', purchasePrice: 49, balance: 35, firstAgo: 70, services: [] },
  { carrier: 'Kangaroo Mobile', number: '+61491570110', region: '🇦🇺', country: '澳大利亚', type: 'eSIM · 卡托', kind: 'adapter', color: 'orange', device: '卡托 B', keepAlive: ['购买续费套餐'], cycleDays: 365, price: 10, currency: 'AUD', purchasePrice: 10, balance: null, firstAgo: 300, services: ['Telegram'] },
  { carrier: 'Kiwi Wireless', number: '+64215550166', region: '🇳🇿', country: '新西兰', type: 'Physical SIM', kind: 'physical', color: 'brown', device: null, keepAlive: ['充值余额'], cycleDays: 365, price: 10, currency: 'NZD', purchasePrice: 20, balance: 0, firstAgo: 400, status: 'cancelled', services: [] },
  { carrier: 'Hangang Mobile', number: '+821055550111', region: '🇰🇷', country: '韩国', type: 'eSIM · 直写手机', kind: 'embedded', color: 'blue', device: '备用机', keepAlive: ['自动扣费'], cycleDays: 30, price: 3300, currency: 'KRW', purchasePrice: 3300, balance: null, firstAgo: 50, services: ['Telegram'] },
  { carrier: 'Tulip Mobile', number: '+31655550188', region: '🇳🇱', country: '荷兰', type: 'eSIM · 卡托', kind: 'adapter', color: 'purple', device: '卡托 A', keepAlive: ['有效使用（含收发短信）'], cycleDays: 270, price: 0, currency: 'EUR', purchasePrice: 3, balance: 2, firstAgo: 180, services: ['WhatsApp'] },
]

function addDays(base: Date, days: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

function key(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function buildDemoCards(): SimCard[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return SPECS.map((spec, index): SimCard => {
    const last4 = spec.number.slice(-4)
    const first = addDays(today, -spec.firstAgo)
    const rate = RATES[spec.currency] ?? 1
    const history: SimRecord[] = []
    let date = first
    let extendsTo = addDays(first, spec.cycleDays)
    history.push({
      id: `demo-${index}-0`,
      type: '首次购买/开卡',
      kind: 'purchase',
      date: key(date),
      amount: spec.purchasePrice,
      currency: spec.currency,
      rate,
      amountCNY: Math.round(spec.purchasePrice * rate * 100) / 100,
      extendsTo: key(extendsTo),
      title: `${spec.carrier} · ${last4} · 首购 · ${key(date)}`,
      accounts: ['Demo 信用卡'],
    })

    const cancelledAt = spec.status === 'cancelled' ? key(addDays(today, -12)) : null
    let n = 1
    while (!spec.status && extendsTo <= addDays(today, 3) && n < 40) {
      date = addDays(extendsTo, -2)
      extendsTo = addDays(extendsTo, spec.cycleDays)
      history.push({
        id: `demo-${index}-${n}`,
        type: '续费/保号',
        kind: 'renewal',
        date: key(date),
        amount: spec.price,
        currency: spec.currency,
        rate: spec.price ? rate : null,
        amountCNY: Math.round(spec.price * rate * 100) / 100,
        extendsTo: key(extendsTo),
        title: `${spec.carrier} · ${last4} · 续费 · ${key(date)}`,
        accounts: ['Demo 信用卡'],
      })
      n++
    }
    history.reverse()

    const status: CardStatus = spec.status ?? 'active'
    const totalSpent = history.reduce((sum, r) => sum + (r.amountCNY ?? 0), 0)

    return {
      id: `demo-${String(index + 1).padStart(2, '0')}`,
      name: `${spec.carrier} · ${last4}`,
      carrier: spec.carrier,
      last4,
      numberMasked: `•••• ${last4}`,
      region: spec.region,
      countryName: spec.country,
      type: spec.type,
      typeKind: spec.kind,
      typeColor: spec.color,
      device: spec.device,
      keepAlive: spec.keepAlive,
      cycleDays: spec.cycleDays,
      cycleLabel: `每 ${spec.cycleDays} 天`,
      price: spec.price,
      currency: spec.currency,
      balance: spec.balance,
      balanceUpdatedAt: spec.balance === null ? null : key(addDays(today, -((index * 17) % 120))),
      expiresAt: key(extendsTo),
      nextRenewalAt: cancelledAt ? null : key(extendsTo),
      nextRenewalEnd: null,
      periodStart: history[0]?.date ?? null,
      status,
      statusLabel: status === 'cancelled' ? '已注销' : '使用中',
      cancelledAt,
      firstPurchaseAt: key(first),
      totalSpentCNY: Math.round(totalSpent * 100) / 100,
      urgency: null,
      order: index,
      history,
      number: spec.number,
      services: spec.services,
      account: 'demo@example.com',
      paymentAccounts: ['Demo 信用卡'],
      dataCheck: null,
      notionUrl: null,
    }
  })
}
