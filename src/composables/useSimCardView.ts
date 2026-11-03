import type { SimCard } from '@shared/types'
import { computed } from 'vue'
import { useExchangeRates } from '@/composables/useExchangeRates'
import {
  daysSince,
  formatCNY,
  getKeepCost,
  getPurchase,
  getValidity,
  getValidityDaysText,
  getValidityTooltip,
  VALIDITY_TONE_TEXT,
} from '@/utils/cardHelpers'

/** Key-value row rendered on a SIM card */
export interface SimInfoRow {
  label: string
  value: string
  tooltip?: string
}

/** Shared display state for all three SIM card layout variants */
export function useSimCardView(getCard: () => SimCard) {
  const { rates } = useExchangeRates()

  const card = computed(getCard)
  const validity = computed(() => getValidity(card.value))
  const daysText = computed(() => getValidityDaysText(validity.value))
  const daysClass = computed(() => validity.value.hot ? `${VALIDITY_TONE_TEXT[validity.value.tone]} sim-glow-text` : '')
  const validityTooltip = computed(() => getValidityTooltip(card.value, validity.value))

  const purchase = computed(() => getPurchase(card.value))
  const purchaseText = computed(() => purchase.value.cny === null ? '-' : formatCNY(purchase.value.cny, 0))
  const purchaseTooltip = computed(() => {
    const held = daysSince(card.value.firstPurchaseAt)
    const amount = purchase.value.original ?? purchaseText.value
    return held === null || held < 0 ? `首次购买 ${amount}` : `首次购买 ${amount} · 已持有 ${held} 天`
  })

  const keepCost = computed(() => getKeepCost(card.value, rates.value))

  const subtitle = computed(() => [card.value.numberMasked, card.value.countryName].filter(Boolean).join(' · '))

  const inactive = computed(() => card.value.status !== 'active')
  const inactiveLabel = computed(() => card.value.status === 'cancelled' ? '已注销' : '已过期')
  const inactiveDate = computed(() => (card.value.status === 'cancelled' ? card.value.cancelledAt : card.value.expiresAt) ?? '')
  const inactiveClass = computed(() => card.value.status === 'cancelled' ? 'text-slate-500' : 'text-red-600')

  const expiryRow = computed<SimInfoRow>(() => ({ label: '到期', value: card.value.expiresAt ?? '-' }))
  const purchaseRow = computed<SimInfoRow>(() => ({
    label: '购入',
    value: purchase.value.date ? `${purchaseText.value} · ${purchase.value.date}` : purchaseText.value,
    tooltip: purchaseTooltip.value,
  }))
  const keepRow = computed<SimInfoRow>(() => ({ label: '保号', value: keepCost.value.long, tooltip: keepCost.value.tooltip }))

  return {
    validity,
    daysText,
    daysClass,
    validityTooltip,
    purchaseText,
    purchaseTooltip,
    keepCost,
    subtitle,
    inactive,
    inactiveLabel,
    inactiveDate,
    inactiveClass,
    expiryRow,
    purchaseRow,
    keepRow,
  }
}
