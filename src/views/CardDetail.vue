<script setup lang="ts">
import type { CurrencyCode } from '@/utils/financeHelper'
import { Icon } from '@iconify/vue'
import { computed, defineAsyncComponent, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardX } from '@/components/ui/card-x'
import { Empty } from '@/components/ui/empty'
import { useBackgroundSurface } from '@/composables/useBackgroundSurface'
import { useExchangeRates } from '@/composables/useExchangeRates'
import { useCardsStore } from '@/stores/cards'
import {
  billingPeriodText,
  countryName,
  cycleText,
  formatAmount,
  formatCNY,
  getBalanceInfo,
  getHoldInfo,
  getNumberDisplay,
  getRenewalDays,
  getRenewalTextClass,
  isBalanceStale,
  joinList,
  keepAliveLabels,
  shortTypeLabel,
  statusText,
} from '@/utils/cardHelpers'
import { getKindIcon, getKindName, getTypeColorClass } from '@/utils/cardTypeHelper'
import * as financeHelper from '@/utils/financeHelper'
import { getFlagSrc } from '@/utils/regionHelper'

const RenewalHistory = defineAsyncComponent(() => import('@/components/RenewalHistory.vue'))

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const { pickSurfaceClass } = useBackgroundSurface()
const cardsStore = useCardsStore()
const { rates: exchangeRates, baseCurrency: financeBaseCurrency } = useExchangeRates()

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'instant' })
})

const data = computed(() => cardsStore.cardsById.get(String(route.params.id)))

interface InfoItem {
  /** Stable key; `label` changes with the language */
  key: string
  label: string
  value: string | undefined
  icon?: string
  valueClass?: string
  locked?: boolean
}

interface MetricCard {
  label: string
  value: string
  unit?: string
  icon: string
  valueClass?: string
}

function formatFinanceMetric(amountCNY: number, currency: CurrencyCode): { value: string, unit: string } {
  const targetRate = exchangeRates.value[currency] || 1
  const formatted = financeHelper.formatFinanceAmount(amountCNY * targetRate, currency)
  return { value: `${formatted.symbol}${formatted.value}`, unit: formatted.currency }
}

const metricCards = computed<MetricCard[]>(() => {
  const card = data.value
  if (!card)
    return []

  const price = card.price > 0
    ? { value: formatAmount(card.price, card.currency), unit: card.cycleDays > 0 ? `/ ${billingPeriodText(card.cycleDays)}` : undefined }
    : { value: t('detail.free'), unit: undefined }

  const monthly = card.cycleDays > 0 && card.price > 0
    ? formatFinanceMetric(financeHelper.calculateMonthlyAverageCostCNY(card, exchangeRates.value), financeBaseCurrency.value)
    : null

  const days = getRenewalDays(card)
  const remaining = card.status === 'cancelled'
    ? { value: statusText('cancelled') }
    : days === null
      ? { value: '-' }
      : days < 0
        ? { value: t('days.overdue', -days) }
        : days === 0
          ? { value: t('days.today') }
          : { value: String(days), unit: t('days.unit', days) }

  const remainingValue = formatFinanceMetric(financeHelper.calculateRemainingValueCNY(card, exchangeRates.value), financeBaseCurrency.value)

  return [
    { label: t('detail.metrics.price'), value: price.value, unit: price.unit, icon: 'tabler:cash' },
    { label: t('detail.metrics.monthly'), value: monthly ? monthly.value : t('detail.notApplicable'), unit: monthly ? t('detail.perMonth', { currency: monthly.unit }) : undefined, icon: 'tabler:receipt-2' },
    {
      label: t('detail.metrics.remaining'),
      value: remaining.value,
      unit: remaining.unit,
      icon: 'tabler:calendar-dollar',
      valueClass: getRenewalTextClass(card),
    },
    { label: t('detail.metrics.remainingValue'), value: remainingValue.value, unit: remainingValue.unit, icon: 'tabler:coins' },
  ]
})

const numberInfo = computed<InfoItem[]>(() => {
  const card = data.value
  const locked = !cardsStore.full
  const lockedValue = t('detail.locked')
  return [
    { key: 'number', label: t('detail.fields.number'), value: card ? getNumberDisplay(card) : '-', icon: 'tabler:phone', valueClass: 'font-mono' },
    { key: 'country', label: t('detail.fields.country'), value: card ? countryName(card) || '-' : '-', icon: 'tabler:world' },
    { key: 'type', label: t('detail.fields.type'), value: locked ? lockedValue : card?.type ? shortTypeLabel(card.type) : '-', icon: 'tabler:device-sim', locked },
    { key: 'device', label: t('detail.fields.device'), value: locked ? lockedValue : card?.device || '-', icon: 'tabler:device-mobile', locked },
  ]
})

const keepAliveInfo = computed<InfoItem[]>(() => {
  const card = data.value
  return [
    { key: 'keepAlive', label: t('detail.fields.keepAlive'), value: card ? joinList(keepAliveLabels(card)) || '-' : '-', icon: 'tabler:shield-check' },
    { key: 'cycle', label: t('detail.fields.cycle'), value: card ? cycleText(card) : '-', icon: 'tabler:repeat' },
    { key: 'nextRenewal', label: t('detail.fields.nextRenewal'), value: card?.nextRenewalEnd ? `${card.nextRenewalAt} ~ ${card.nextRenewalEnd}` : card?.nextRenewalAt ?? '-', icon: 'tabler:calendar-event' },
    { key: 'expiresAt', label: t('detail.fields.expiresAt'), value: card?.expiresAt ?? '-', icon: 'tabler:calendar-check' },
  ]
})

const balanceInfo = computed<InfoItem[]>(() => {
  const card = data.value
  if (!card)
    return []
  const locked = !cardsStore.full
  const lockedValue = t('detail.locked')
  const hold = getHoldInfo(card)
  return [
    { key: 'balance', label: t('detail.fields.balance'), value: locked ? lockedValue : getBalanceInfo(card).text, icon: 'tabler:wallet', locked },
    { key: 'balanceUpdatedAt', label: t('detail.fields.balanceUpdatedAt'), value: locked ? lockedValue : card.balanceUpdatedAt ?? '-', icon: 'tabler:clock', locked, valueClass: !locked && isBalanceStale(card) ? 'text-yellow-600 dark:text-yellow-400' : '' },
    { key: 'held', label: t('detail.fields.held'), value: hold.days === null ? '-' : t('days.count', hold.days), icon: 'tabler:hourglass' },
  ]
})

const accountInfo = computed<InfoItem[]>(() => {
  const card = data.value
  const locked = !cardsStore.full
  const lockedValue = t('detail.locked')
  return [
    { key: 'account', label: t('detail.fields.account'), value: locked ? lockedValue : card?.account || '-', icon: 'tabler:user', locked },
    { key: 'paymentAccounts', label: t('detail.fields.paymentAccounts'), value: locked ? lockedValue : joinList(card?.paymentAccounts ?? []) || '-', icon: 'tabler:credit-card', locked },
    { key: 'services', label: t('detail.fields.services'), value: locked ? lockedValue : joinList(card?.services ?? []) || '-', icon: 'tabler:link', locked },
    { key: 'dataCheck', label: t('detail.fields.dataCheck'), value: locked ? lockedValue : card?.dataCheck || t('detail.noIssues'), icon: 'tabler:alert-triangle', locked, valueClass: !locked && card?.dataCheck ? 'text-yellow-600 dark:text-yellow-400' : '' },
  ]
})

const statusBadgeVariant = computed(() => {
  const status = data.value?.status
  return status === 'active' ? 'default' : status === 'expired' ? 'destructive' : 'secondary'
})

const spendSummary = computed(() => {
  const card = data.value
  if (!card)
    return ''
  return t('detail.totalSpent', { amount: formatCNY(card.totalSpentCNY ?? 0) })
})
</script>

<template>
  <div class="instance-detail space-y-4">
    <div v-if="!data" class="p-4">
      <CardX
        class="border-none transition-all rounded-md"
        :class="pickSurfaceClass('bg-background/60 hover:bg-background', 'bg-background/50 hover:bg-background backdrop-blur-xs')"
      >
        <Empty :description="t('detail.notFound')">
          <template #extra>
            <Button @click="router.push('/')">
              {{ t('detail.backHome') }}
            </Button>
          </template>
        </Empty>
      </CardX>
    </div>

    <template v-else>
      <div class="px-4 flex gap-4 items-center">
        <Button variant="ghost" size="icon-sm" class="bg-background/50 hover:bg-background" @click="router.push('/')">
          <Icon icon="tabler:arrow-left" :width="16" :height="16" />
        </Button>
        <div class="text-lg font-bold flex gap-2 items-center min-w-0">
          <img
            v-if="data.region" :src="getFlagSrc(data.region)" :alt="countryName(data)"
            class="size-6"
          >
          <span class="truncate">{{ data.name }}</span>
          <Icon :icon="getKindIcon(data.typeKind)" :width="18" :height="18" :class="getTypeColorClass(data.typeColor)" :aria-label="getKindName(data.typeKind)" />
        </div>
        <Badge :variant="statusBadgeVariant" class="text-xs !rounded shrink-0">
          {{ statusText(data.status) }}
        </Badge>
        <div class="ml-auto hidden sm:block text-xs text-muted-foreground">
          {{ spendSummary }}
        </div>
      </div>

      <div class="px-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CardX
          v-for="item in metricCards" :key="item.label" hoverable size="small"
          class="group h-full border-none transition-all rounded-md"
          :class="pickSurfaceClass('bg-background/60 hover:bg-background', 'bg-background/50 hover:bg-background backdrop-blur-xs')"
          content-class="h-full !p-3"
        >
          <div class="flex h-full min-h-10 md:min-h-18 flex-col justify-between gap-3">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-medium tracking-wider text-muted-foreground">{{ item.label }}</span>
              <Icon
                :icon="item.icon" :width="20" :height="20"
                class="text-slate-500/25 transition-colors group-hover:text-slate-500"
              />
            </div>
            <div class="min-w-0 space-y-1">
              <div
                class="flex min-w-0 items-baseline gap-1 truncate font-semibold leading-none"
                :class="item.valueClass"
              >
                <span class="truncate text-base sm:text-2xl">{{ item.value }}</span>
                <span v-if="item.unit" class="shrink-0 text-[11px] font-medium text-muted-foreground sm:text-xs">
                  {{ item.unit }}
                </span>
              </div>
            </div>
          </div>
        </CardX>
      </div>

      <div class="px-4 gap-4 grid grid-cols-1 lg:grid-cols-2">
        <CardX
          :title="t('detail.sections.number')" size="small"
          class="group h-full border-none transition-all rounded-md"
          :class="pickSurfaceClass('bg-background/60 hover:bg-background', 'bg-background/50 hover:bg-background backdrop-blur-xs')"
        >
          <div class="gap-3 grid grid-cols-3">
            <div
              v-for="(item, index) in numberInfo" :key="item.key"
              class="min-w-0 flex flex-col gap-1 rounded-sm bg-slate-500/5 p-2" :class="!index && 'col-span-3'"
            >
              <div class="flex gap-1 items-center text-muted-foreground">
                <Icon v-if="item.icon" :icon="item.icon" :width="14" :height="14" />
                <span class="text-xs sm:text-sm">{{ item.label }}</span>
              </div>
              <span class="text-xs sm:text-sm break-all flex items-center gap-1" :class="[item.valueClass, item.locked && 'text-muted-foreground']">
                <Icon v-if="item.locked" icon="tabler:lock" :width="12" :height="12" />
                {{ item.value }}
              </span>
            </div>
          </div>
        </CardX>

        <CardX
          :title="t('detail.sections.keepAlive')" size="small"
          class="group h-full border-none transition-all rounded-md"
          :class="pickSurfaceClass('bg-background/60 hover:bg-background', 'bg-background/50 hover:bg-background backdrop-blur-xs')"
        >
          <div class="gap-3 grid grid-cols-1 sm:grid-cols-2">
            <div
              v-for="item in keepAliveInfo" :key="item.key"
              class="min-w-0 flex flex-col gap-1 rounded-sm bg-slate-500/5 p-2"
            >
              <div class="flex gap-1 items-center text-muted-foreground">
                <Icon v-if="item.icon" :icon="item.icon" :width="14" :height="14" />
                <span class="text-xs sm:text-sm">{{ item.label }}</span>
              </div>
              <span class="text-xs sm:text-sm break-all" :class="item.key === 'nextRenewal' ? getRenewalTextClass(data) : ''">
                {{ item.value }}
              </span>
            </div>
          </div>
        </CardX>

        <CardX
          :title="t('detail.sections.balance')" size="small"
          class="group h-full border-none transition-all rounded-md"
          :class="pickSurfaceClass('bg-background/60 hover:bg-background', 'bg-background/50 hover:bg-background backdrop-blur-xs')"
        >
          <div class="gap-3 grid grid-cols-3">
            <div
              v-for="item in balanceInfo" :key="item.key"
              class="min-w-0 flex flex-col gap-1 rounded-sm bg-slate-500/5 p-2"
            >
              <div class="flex gap-1 items-center text-muted-foreground">
                <Icon v-if="item.icon" :icon="item.icon" :width="14" :height="14" />
                <span class="text-xs sm:text-sm">{{ item.label }}</span>
              </div>
              <span class="text-xs sm:text-sm break-all flex items-center gap-1" :class="[item.valueClass, item.locked && 'text-muted-foreground']">
                <Icon v-if="item.locked" icon="tabler:lock" :width="12" :height="12" />
                {{ item.value }}
              </span>
            </div>
          </div>
        </CardX>

        <CardX
          :title="t('detail.sections.account')" size="small"
          class="group h-full border-none transition-all rounded-md"
          :class="pickSurfaceClass('bg-background/60 hover:bg-background', 'bg-background/50 hover:bg-background backdrop-blur-xs')"
        >
          <div class="gap-3 grid grid-cols-2">
            <div
              v-for="item in accountInfo" :key="item.key"
              class="min-w-0 flex flex-col gap-1 rounded-sm bg-slate-500/5 p-2"
            >
              <div class="flex gap-1 items-center text-muted-foreground">
                <Icon v-if="item.icon" :icon="item.icon" :width="14" :height="14" />
                <span class="text-xs sm:text-sm">{{ item.label }}</span>
              </div>
              <span class="text-xs sm:text-sm break-all flex items-center gap-1" :class="[item.valueClass, item.locked && 'text-muted-foreground']">
                <Icon v-if="item.locked" icon="tabler:lock" :width="12" :height="12" />
                {{ item.value }}
              </span>
            </div>
          </div>
        </CardX>
      </div>

      <RenewalHistory :card="data" class="mx-4" />
    </template>
  </div>
</template>
