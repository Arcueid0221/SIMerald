<script setup lang="ts">
import type { CurrencyCode } from '@/utils/financeHelper'
import { Icon } from '@iconify/vue'
import { computed, defineAsyncComponent, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardX } from '@/components/ui/card-x'
import { Empty } from '@/components/ui/empty'
import { useBackgroundSurface } from '@/composables/useBackgroundSurface'
import { useExchangeRates } from '@/composables/useExchangeRates'
import { useCardsStore } from '@/stores/cards'
import {
  formatAmount,
  formatCNY,
  getBalanceInfo,
  getHoldInfo,
  getNumberDisplay,
  getRenewalDaysText,
  getRenewalTextClass,
  isBalanceStale,
  shortTypeLabel,
  statusText,
} from '@/utils/cardHelpers'
import { getKindIcon, getKindName, getTypeColorClass } from '@/utils/cardTypeHelper'
import * as financeHelper from '@/utils/financeHelper'
import { getFlagSrc, getRegionDisplayName } from '@/utils/regionHelper'
import { getBillingCycleText } from '@/utils/tagHelper'

const RenewalHistory = defineAsyncComponent(() => import('@/components/RenewalHistory.vue'))

const DAYS_TEXT_REGEX = /^(\d+) 天$/

const route = useRoute()
const router = useRouter()

const { pickSurfaceClass } = useBackgroundSurface()
const cardsStore = useCardsStore()
const { rates: exchangeRates, baseCurrency: financeBaseCurrency } = useExchangeRates()

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'instant' })
})

const data = computed(() => cardsStore.cardsById.get(String(route.params.id)))

interface InfoItem {
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
    ? { value: formatAmount(card.price, card.currency), unit: card.cycleDays > 0 ? `/ ${getBillingCycleText(card.cycleDays)}` : undefined }
    : { value: '免费', unit: undefined }

  const monthly = card.cycleDays > 0 && card.price > 0
    ? formatFinanceMetric(financeHelper.calculateMonthlyAverageCostCNY(card, exchangeRates.value), financeBaseCurrency.value)
    : null

  const remainingText = getRenewalDaysText(card)
  const remainingMatch = remainingText.match(DAYS_TEXT_REGEX)

  const remainingValue = formatFinanceMetric(financeHelper.calculateRemainingValueCNY(card, exchangeRates.value), financeBaseCurrency.value)

  return [
    { label: '续费价格', value: price.value, unit: price.unit, icon: 'tabler:cash' },
    { label: '月均支出', value: monthly ? monthly.value : '不适用', unit: monthly ? `${monthly.unit} / 月` : undefined, icon: 'tabler:receipt-2' },
    {
      label: '剩余时间',
      value: remainingMatch ? remainingMatch[1]! : remainingText,
      unit: remainingMatch ? '天' : undefined,
      icon: 'tabler:calendar-dollar',
      valueClass: getRenewalTextClass(card),
    },
    { label: '剩余价值', value: remainingValue.value, unit: remainingValue.unit, icon: 'tabler:coins' },
  ]
})

const numberInfo = computed<InfoItem[]>(() => {
  const card = data.value
  const locked = !cardsStore.full
  const lockedValue = '登录后可见'
  return [
    { label: '号码', value: card ? getNumberDisplay(card) : '-', icon: 'tabler:phone', valueClass: 'font-mono' },
    { label: '国家/地区', value: card?.countryName || '-', icon: 'tabler:world' },
    { label: '卡片类型', value: locked ? lockedValue : card?.type ? shortTypeLabel(card.type) : '-', icon: 'tabler:device-sim', locked },
    { label: '使用设备', value: locked ? lockedValue : card?.device || '-', icon: 'tabler:device-mobile', locked },
  ]
})

const keepAliveInfo = computed<InfoItem[]>(() => {
  const card = data.value
  return [
    { label: '保号方式', value: card?.keepAlive.join('、') || '-', icon: 'tabler:shield-check' },
    { label: '续费周期', value: card?.cycleLabel || '-', icon: 'tabler:repeat' },
    { label: '下次续费', value: card?.nextRenewalEnd ? `${card.nextRenewalAt} ~ ${card.nextRenewalEnd}` : card?.nextRenewalAt ?? '-', icon: 'tabler:calendar-event' },
    { label: '有效期至', value: card?.expiresAt ?? '-', icon: 'tabler:calendar-check' },
  ]
})

const balanceInfo = computed<InfoItem[]>(() => {
  const card = data.value
  if (!card)
    return []
  const locked = !cardsStore.full
  const lockedValue = '登录后可见'
  const hold = getHoldInfo(card)
  return [
    { label: '当前余额', value: locked ? lockedValue : getBalanceInfo(card).text, icon: 'tabler:wallet', locked },
    { label: '余额更新', value: locked ? lockedValue : card.balanceUpdatedAt ?? '-', icon: 'tabler:clock', locked, valueClass: !locked && isBalanceStale(card) ? 'text-yellow-600 dark:text-yellow-400' : '' },
    { label: '已持有', value: hold.days === null ? '-' : `${hold.days} 天`, icon: 'tabler:hourglass' },
  ]
})

const accountInfo = computed<InfoItem[]>(() => {
  const card = data.value
  const locked = !cardsStore.full
  const lockedValue = '登录后可见'
  return [
    { label: '管理账号', value: locked ? lockedValue : card?.account || '-', icon: 'tabler:user', locked },
    { label: '扣款账户', value: locked ? lockedValue : card?.paymentAccounts?.join('、') || '-', icon: 'tabler:credit-card', locked },
    { label: '绑定的服务', value: locked ? lockedValue : card?.services?.join('、') || '-', icon: 'tabler:link', locked },
    { label: '数据检查', value: locked ? lockedValue : card?.dataCheck || '没有问题', icon: 'tabler:alert-triangle', locked, valueClass: !locked && card?.dataCheck ? 'text-yellow-600 dark:text-yellow-400' : '' },
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
  return `累计花费 ${formatCNY(card.totalSpentCNY ?? 0)}`
})
</script>

<template>
  <div class="instance-detail space-y-4">
    <div v-if="!data" class="p-4">
      <CardX
        class="border-none transition-all rounded-md"
        :class="pickSurfaceClass('bg-background/60 hover:bg-background', 'bg-background/50 hover:bg-background backdrop-blur-xs')"
      >
        <Empty description="号码不存在或已被删除">
          <template #extra>
            <Button @click="router.push('/')">
              返回首页
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
            v-if="data.region" :src="getFlagSrc(data.region)" :alt="getRegionDisplayName(data.region)"
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
          title="号码信息" size="small"
          class="group h-full border-none transition-all rounded-md"
          :class="pickSurfaceClass('bg-background/60 hover:bg-background', 'bg-background/50 hover:bg-background backdrop-blur-xs')"
        >
          <div class="gap-3 grid grid-cols-3">
            <div
              v-for="(item, index) in numberInfo" :key="item.label"
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
          title="保号信息" size="small"
          class="group h-full border-none transition-all rounded-md"
          :class="pickSurfaceClass('bg-background/60 hover:bg-background', 'bg-background/50 hover:bg-background backdrop-blur-xs')"
        >
          <div class="gap-3 grid grid-cols-1 sm:grid-cols-2">
            <div
              v-for="item in keepAliveInfo" :key="item.label"
              class="min-w-0 flex flex-col gap-1 rounded-sm bg-slate-500/5 p-2"
            >
              <div class="flex gap-1 items-center text-muted-foreground">
                <Icon v-if="item.icon" :icon="item.icon" :width="14" :height="14" />
                <span class="text-xs sm:text-sm">{{ item.label }}</span>
              </div>
              <span class="text-xs sm:text-sm break-all" :class="item.label === '下次续费' ? getRenewalTextClass(data) : ''">
                {{ item.value }}
              </span>
            </div>
          </div>
        </CardX>

        <CardX
          title="余额信息" size="small"
          class="group h-full border-none transition-all rounded-md"
          :class="pickSurfaceClass('bg-background/60 hover:bg-background', 'bg-background/50 hover:bg-background backdrop-blur-xs')"
        >
          <div class="gap-3 grid grid-cols-3">
            <div
              v-for="item in balanceInfo" :key="item.label"
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
          title="账号信息" size="small"
          class="group h-full border-none transition-all rounded-md"
          :class="pickSurfaceClass('bg-background/60 hover:bg-background', 'bg-background/50 hover:bg-background backdrop-blur-xs')"
        >
          <div class="gap-3 grid grid-cols-2">
            <div
              v-for="item in accountInfo" :key="item.label"
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
