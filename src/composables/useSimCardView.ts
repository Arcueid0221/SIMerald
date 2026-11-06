import type { SimCard } from '@shared/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useExchangeRates } from '@/composables/useExchangeRates'
import {
  countryName,
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
  const { t } = useI18n()

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
    return held === null || held < 0
      ? t('card.firstPurchase', { amount })
      : `${t('card.firstPurchase', { amount })} · ${t('card.heldFor', { days: t('days.count', held) })}`
  })

  const keepCost = computed(() => getKeepCost(card.value, rates.value))

  const subtitle = computed(() => [card.value.numberMasked, countryName(card.value)].filter(Boolean).join(' · '))

  const inactive = computed(() => card.value.status !== 'active')
  const inactiveLabel = computed(() => t(`status.${card.value.status === 'cancelled' ? 'cancelled' : 'expired'}`))
  const inactiveDate = computed(() => (card.value.status === 'cancelled' ? card.value.cancelledAt : card.value.expiresAt) ?? '')
  const inactiveClass = computed(() => card.value.status === 'cancelled' ? 'text-slate-500' : 'text-red-600')

  const expiryRow = computed<SimInfoRow>(() => ({ label: t('card.rows.expiry'), value: card.value.expiresAt ?? '-' }))
  const purchaseRow = computed<SimInfoRow>(() => ({
    label: t('card.rows.purchase'),
    value: purchase.value.date ? `${purchaseText.value} · ${purchase.value.date}` : purchaseText.value,
    tooltip: purchaseTooltip.value,
  }))
  const keepRow = computed<SimInfoRow>(() => ({ label: t('card.rows.keep'), value: keepCost.value.long, tooltip: keepCost.value.tooltip }))

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
