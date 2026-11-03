<script setup lang="ts">
import type { SimCard } from '@shared/types'
import type { CurrencyCode } from '@/utils/financeHelper'
import { Icon } from '@iconify/vue'
import { computed, defineAsyncComponent, ref } from 'vue'
import EarthGlobe from '@/components/EarthGlobe.vue'
import { CardX } from '@/components/ui/card-x'
import { DataTooltip } from '@/components/ui/data-tooltip'
import { useBackgroundSurface } from '@/composables/useBackgroundSurface'
import { useExchangeRates } from '@/composables/useExchangeRates'
import { useAppStore } from '@/stores/app'
import { useCardsStore } from '@/stores/cards'
import { formatCNY, getRenewalDays } from '@/utils/cardHelpers'
import * as financeHelper from '@/utils/financeHelper'

const props = defineProps<{
  cards?: SimCard[]
  globeCards?: SimCard[]
  transitionKey?: string
}>()

const EarthMaps = defineAsyncComponent(() => import('@/components/EarthMaps.vue'))

const UPCOMING_DAYS = 30

const appStore = useAppStore()
const { pickSurfaceClass } = useBackgroundSurface()
const cardsStore = useCardsStore()
const { rates: exchangeRates, baseCurrency: exchangeRateBaseCurrency, setBaseCurrency } = useExchangeRates()
const financeRateCurrencies: readonly CurrencyCode[] = financeHelper.DISPLAY_FINANCE_CURRENCIES
const summaryCards = computed(() => props.cards ?? cardsStore.cards)
const summaryTransitionKey = computed(() => props.transitionKey ?? 'all')
const metricSwitchTransitionProps = computed(() => ({
  ...(appStore.disablePageAnimation
    ? { css: false }
    : { name: 'metric-switch', mode: 'out-in' as const }),
}))

const openFinanceCard = ref(false)

function getMetricSwitchStyle(index: number): Record<string, string> {
  return {
    '--metric-switch-delay': `${index * 35}ms`,
  }
}

function setExchangeRateBaseCurrency(event: Event): void {
  const target = event.target as HTMLSelectElement
  setBaseCurrency(financeHelper.normalizeCurrency(target.value))
}

// ==================== Numbers & Countries ====================
const activeCards = computed(() => summaryCards.value.filter(card => card.status === 'active'))
const keptCards = computed(() => summaryCards.value.filter(card => card.status !== 'cancelled'))
const countryCount = computed(() => new Set(keptCards.value.map(card => card.region || card.countryName).filter(Boolean)).size)

// ==================== Total Spend ====================
const spendBreakdown = computed(() => {
  let purchase = 0
  let renewal = 0
  let other = 0
  let total = 0
  for (const card of summaryCards.value) {
    total += card.totalSpentCNY ?? 0
    for (const record of card.history) {
      const amount = record.amountCNY ?? 0
      if (record.type.includes('首次') || record.type.includes('开卡'))
        purchase += amount
      else if (record.type.includes('续费') || record.type.includes('保号'))
        renewal += amount
      else
        other += amount
    }
  }
  return { total, purchase, renewal, other }
})
const formattedSpend = computed(() => financeHelper.formatFinanceAmount(spendBreakdown.value.total, 'CNY'))
const spendTooltip = computed(() => [
  `首购 ${formatCNY(spendBreakdown.value.purchase)}`,
  `续费 ${formatCNY(spendBreakdown.value.renewal)}`,
  spendBreakdown.value.other > 0 ? `其他 ${formatCNY(spendBreakdown.value.other)}` : '',
].filter(Boolean).join('\n'))

// ==================== Renewals ====================
const upcoming = computed(() => keptCards.value
  .map(card => ({ card, days: getRenewalDays(card) }))
  .filter((item): item is { card: SimCard, days: number } => item.days !== null && item.days <= UPCOMING_DAYS)
  .sort((a, b) => a.days - b.days))
const upcomingTooltip = computed(() => upcoming.value.length
  ? upcoming.value.map(({ card, days }) => `${card.name}  ${days < 0 ? `过期 ${-days} 天` : `${days} 天`}`).join('\n')
  : `${UPCOMING_DAYS} 天内没有要续费的号码`)
const nextRenewal = computed(() => keptCards.value
  .map(card => ({ card, days: getRenewalDays(card) }))
  .filter((item): item is { card: SimCard, days: number } => item.days !== null)
  .sort((a, b) => a.days - b.days)[0] ?? null)
const nextRenewalText = computed(() => {
  if (!nextRenewal.value)
    return null
  const { days } = nextRenewal.value
  if (days === 0)
    return { value: '今天', unit: '' }
  return days < 0 ? { value: -days, unit: '天前到期' } : { value: days, unit: '天后' }
})

// ==================== Valuation ====================
const targetExchangeRate = computed(() => exchangeRates.value[exchangeRateBaseCurrency.value] || 1)
const remainingValueCNY = computed(() => {
  return financeHelper.calculateTotalRemainingValueCNY(summaryCards.value, exchangeRates.value)
})
const remainingValue = computed(() => {
  return remainingValueCNY.value * targetExchangeRate.value
})
const formattedRemainingValue = computed(() => {
  return financeHelper.formatFinanceAmount(remainingValue.value, exchangeRateBaseCurrency.value)
})
const totalValueCNY = computed(() => {
  return financeHelper.calculateTotalValueCNY(summaryCards.value, exchangeRates.value)
})
const totalValue = computed(() => {
  return totalValueCNY.value * targetExchangeRate.value
})
const formattedTotalValue = computed(() => {
  return financeHelper.formatFinanceAmount(totalValue.value, exchangeRateBaseCurrency.value)
})
const monthlyAverageCostCNY = computed(() => {
  return financeHelper.calculateTotalMonthlyAverageCostCNY(summaryCards.value, exchangeRates.value)
})
const monthlyAverageCost = computed(() => {
  return monthlyAverageCostCNY.value * targetExchangeRate.value
})
const formattedMonthlyAverageCost = computed(() => {
  return financeHelper.formatFinanceAmount(monthlyAverageCost.value, exchangeRateBaseCurrency.value)
})
const financeSummaryItems = computed(() => [
  {
    label: '总价值',
    icon: 'tabler:wallet',
    value: formattedTotalValue.value.value,
    symbol: formattedTotalValue.value.symbol,
    currency: formattedTotalValue.value.currency,
  },
  {
    label: '月均支出',
    icon: 'tabler:receipt-2',
    value: formattedMonthlyAverageCost.value.value,
    symbol: formattedMonthlyAverageCost.value.symbol,
    currency: `${formattedMonthlyAverageCost.value.currency}/月`,
  },
  {
    label: '剩余价值',
    icon: 'tabler:coins',
    value: formattedRemainingValue.value.value,
    symbol: formattedRemainingValue.value.symbol,
    currency: formattedRemainingValue.value.currency,
  },
])
const exchangeRateRows = computed(() => financeRateCurrencies.map((currency) => {
  const baseRate = exchangeRates.value[exchangeRateBaseCurrency.value] || 1
  const targetRate = exchangeRates.value[currency] || 1
  const rate = targetRate / baseRate

  return {
    currency,
    baseCurrency: exchangeRateBaseCurrency.value,
    baseSymbol: financeHelper.CURRENCY_SYMBOLS[exchangeRateBaseCurrency.value],
    targetSymbol: financeHelper.CURRENCY_SYMBOLS[currency],
    rate: new Intl.NumberFormat('zh-CN', {
      maximumFractionDigits: 6,
      minimumFractionDigits: 6,
    }).format(rate),
  }
}))
const showEarth = computed(() => appStore.earthViewMode === 'earth' || appStore.earthViewMode === 'earth-stop')
const showMaps = computed(() => appStore.earthViewMode === 'maps')
const showVisualPanel = computed(() => showEarth.value || showMaps.value)
const wrapperClass = computed(() => showVisualPanel.value
  ? 'p-4 grid grid-cols-12 grid-rows-1 gap-2 h-auto md:h-58'
  : 'p-4 grid grid-cols-1 gap-2 h-auto')
const cardGridClass = computed(() => showVisualPanel.value
  ? 'h-42 -mt-42 md:mt-0 col-span-12 row-start-3 z-9 md:h-auto md:col-span-6 md:row-start-1 grid grid-cols-12 grid-rows-2 gap-2'
  : 'col-span-1 grid grid-cols-3 md:grid-cols-6 gap-2')
</script>

<template>
  <div :class="wrapperClass">
    <EarthGlobe v-if="showEarth" :cards="globeCards" class="col-span-12 col-start-1 md:col-span-6 md:col-start-7" />
    <EarthMaps v-else-if="showMaps" :cards="globeCards" class="col-span-12 col-start-1 md:col-span-6 md:col-start-7" />

    <div :class="cardGridClass">
      <CardX
        hoverable
        class="group h-full border-none rounded-md transition-all"
        :class="[
          pickSurfaceClass('bg-background/60 hover:bg-background', 'bg-background/50 hover:bg-background backdrop-blur-xs'),
          showVisualPanel ? 'col-span-4 row-span-1 col-start-1 row-start-1' : 'col-span-1 row-start-1 col-start-1 min-h-18 md:min-h-24 md:row-start-1 md:col-start-1',
        ]"
        content-class="h-full !p-3"
      >
        <div class="flex h-full flex-col justify-between gap-1">
          <div class="flex items-start justify-between">
            <span class="text-xs font-medium tracking-wider text-muted-foreground">在用号码</span>
            <Icon
              icon="tabler:device-sim" :width="20" :height="20"
              class="text-slate-500/20 group-hover:text-slate-500 transition-colors"
            />
          </div>
          <Transition v-bind="metricSwitchTransitionProps">
            <div
              :key="`active-${summaryTransitionKey}`" class="flex items-baseline gap-1 min-w-0"
              :style="getMetricSwitchStyle(0)"
            >
              <span class="text-md md:text-2xl font-bold leading-none tracking-tight">
                {{ activeCards.length }}
              </span>
              <span class="text-[11px] md:text-xs font-medium text-muted-foreground truncate">张</span>
            </div>
          </Transition>
        </div>
      </CardX>
      <CardX
        hoverable
        class="group h-full border-none rounded-md transition-all"
        :class="[
          pickSurfaceClass('bg-background/60 hover:bg-background', 'bg-background/50 hover:bg-background backdrop-blur-xs'),
          showVisualPanel ? 'col-span-4 row-span-1 col-start-1 row-start-2' : 'col-span-1 row-start-2 col-start-1 min-h-18 md:min-h-24 md:row-start-1 md:col-start-2',
        ]"
        content-class="h-full !p-3"
      >
        <div class="flex h-full flex-col justify-between gap-1">
          <div class="flex items-start justify-between">
            <span class="text-xs font-medium tracking-wider text-muted-foreground">覆盖国家或地区</span>
            <Icon
              icon="tabler:world" :width="20" :height="20"
              class="text-slate-500/20 group-hover:text-slate-500 transition-colors"
            />
          </div>
          <Transition v-bind="metricSwitchTransitionProps">
            <div
              :key="`country-${summaryTransitionKey}`" class="flex items-baseline gap-1 min-w-0"
              :style="getMetricSwitchStyle(1)"
            >
              <span class="text-md md:text-2xl font-bold leading-none tracking-tight">{{ countryCount }}</span>
              <span class="text-[11px] md:text-xs font-medium text-muted-foreground truncate">个</span>
            </div>
          </Transition>
        </div>
      </CardX>
      <div
        class="relative w-full h-full"
        :class="showVisualPanel ? 'col-span-4 row-span-1 col-start-5 row-start-1' : 'col-span-1 row-start-1 col-start-2 min-h-18 md:min-h-24 md:row-start-1 md:col-start-3'"
      >
        <CardX
          hoverable
          class="group h-full border-none rounded-md transition-all"
          :class="pickSurfaceClass('bg-background/60 hover:bg-background', 'bg-background/50 hover:bg-background backdrop-blur-xs')"
          content-class="h-full !p-3" @click="openFinanceCard = !openFinanceCard"
        >
          <div class="flex h-full flex-col justify-between gap-1">
            <div class="flex items-start justify-between">
              <span class="text-xs font-medium tracking-wider text-muted-foreground">剩余价值</span>
              <Icon
                icon="tabler:cash" :width="20" :height="20"
                class="text-slate-500/20 group-hover:text-slate-500 transition-colors"
              />
            </div>
            <Transition v-bind="metricSwitchTransitionProps">
              <div
                :key="`remaining-value-${summaryTransitionKey}`" class="flex items-baseline gap-1 min-w-0"
                :style="getMetricSwitchStyle(2)"
              >
                <span class="text-md md:text-2xl font-bold leading-none tracking-tight">
                  {{ formattedRemainingValue.symbol }}{{ formattedRemainingValue.value }}
                </span>
                <span class="block truncate text-[11px] md:text-xs font-medium text-muted-foreground">
                  {{ formattedRemainingValue.currency }}
                </span>
              </div>
            </Transition>
          </div>
        </CardX>
        <CardX
          hoverable
          class="absolute top-0 left-1/2 z-20 h-42 w-[260%] max-w-88 -translate-x-[50%] -translate-y-[25%] rounded-md border-none shadow-[0_0_20px,0_0_0_1px] shadow-emerald-600/10 transition-all"
          :class="[
            pickSurfaceClass('bg-background', 'bg-background/50 backdrop-blur-lg'),
            openFinanceCard ? 'opacity-100 scale-100  -translate-y-[5%]' : 'opacity-0 pointer-events-none scale-50',
          ]"
          content-class="h-full !p-4" @click="openFinanceCard = false"
        >
          <div class="flex h-full min-w-0 flex-col overflow-hidden">
            <div class="shrink-0 grid grid-cols-3 gap-1.5">
              <div v-for="(item, index) in financeSummaryItems" :key="item.label" class="min-w-0">
                <div class="flex mb-1.5 items-center text-xs font-medium text-muted-foreground">
                  {{ item.label }}
                </div>
                <Transition v-bind="metricSwitchTransitionProps">
                  <div
                    :key="`remaining-value-${summaryTransitionKey}-${exchangeRateBaseCurrency}`" class="flex min-w-0 items-baseline truncate"
                    :style="getMetricSwitchStyle(index)"
                  >
                    <span class="shrink-0 text-xs mr-0.5 font-semibold leading-none text-muted-foreground">
                      {{ item.symbol }}
                    </span>
                    <span class=" text-sm md:text-lg font-bold leading-none tracking-tight">
                      {{ item.value }}
                    </span>
                  </div>
                </Transition>
              </div>
            </div>
            <div class="flex-1 my-1.5" />
            <div class="shrink-0 flex flex-col flex-1">
              <div class="flex mb-1 items-center justify-between gap-2">
                <div class="flex items-center gap-1 text-xs font-medium tracking-wider text-muted-foreground">
                  今日汇率
                </div>
                <select
                  :value="exchangeRateBaseCurrency"
                  class="shrink-0 rounded-sm border border-border/70 bg-background/70 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus:text-foreground"
                  aria-label="切换汇率基准币种" @click.stop @change.stop="setExchangeRateBaseCurrency"
                >
                  <option v-for="currency in financeRateCurrencies" :key="currency" :value="currency">
                    {{ currency }}
                  </option>
                </select>
              </div>
              <div class="h-15 grid grid-cols-2 gap-y-1 gap-x-4 overflow-auto">
                <div
                  v-for="(row, index) in exchangeRateRows" :key="row.currency"
                  class="text-[11px] flex items-center "
                >
                  <Transition v-bind="metricSwitchTransitionProps">
                    <div :key="`remaining-value-${exchangeRateBaseCurrency}`" class="flex-1 flex justify-between" :style="getMetricSwitchStyle(index)">
                      <span class="text-muted-foreground">
                        {{ row.currency }}
                      </span>
                      <span>
                        {{ row.targetSymbol }}{{ row.rate }}
                      </span>
                    </div>
                  </Transition>
                </div>
              </div>
            </div>
          </div>
        </CardX>
      </div>
      <CardX
        hoverable
        class="group h-full border-none rounded-md transition-all"
        :class="[
          pickSurfaceClass('bg-background/60 hover:bg-background', 'bg-background/50 hover:bg-background backdrop-blur-xs'),
          showVisualPanel ? 'col-span-4 row-span-1 col-start-5 row-start-2' : 'col-span-1 row-start-2 col-start-2 min-h-18 md:min-h-24 md:row-start-1 md:col-start-4',
        ]"
        content-class="h-full !p-3"
      >
        <div class="flex h-full flex-col justify-between gap-1">
          <div class="flex items-start justify-between">
            <span class="text-xs font-medium tracking-wider text-muted-foreground">累计花费</span>
            <Icon
              icon="tabler:receipt" :width="20" :height="20"
              class="text-slate-500/20 group-hover:text-slate-500 transition-colors"
            />
          </div>
          <DataTooltip
            as="span" placement="top"
            :content="spendTooltip"
            class="min-w-0" content-class="whitespace-pre px-2 py-1 left-0 -translate-x-0 leading-normal"
          >
            <Transition v-bind="metricSwitchTransitionProps">
              <div
                :key="`spend-${summaryTransitionKey}`" class="flex items-baseline gap-1"
                :style="getMetricSwitchStyle(3)"
              >
                <span class="inline-block text-md md:text-2xl font-bold leading-none tracking-tight">
                  {{ formattedSpend.symbol }}{{ formattedSpend.value }}
                </span>
                <span class="inline-block text-[11px] md:text-xs font-medium text-muted-foreground">
                  {{ formattedSpend.currency }}
                </span>
              </div>
            </Transition>
          </DataTooltip>
        </div>
      </CardX>

      <CardX
        hoverable
        class="group h-full border-none rounded-md transition-all"
        :class="[
          pickSurfaceClass('bg-background/60 hover:bg-background', 'bg-background/50 hover:bg-background backdrop-blur-xs'),
          showVisualPanel ? 'col-span-4 row-span-1 col-start-9 row-start-1' : 'col-span-1 row-start-1 col-start-3 min-h-18 md:min-h-24 md:row-start-1 md:col-start-5',
        ]"
        content-class="h-full !p-3"
      >
        <div class="flex h-full flex-col justify-between gap-1">
          <div class="flex items-start justify-between">
            <span class="text-xs font-medium tracking-wider text-muted-foreground">{{ UPCOMING_DAYS }} 天内续费</span>
            <Icon
              icon="tabler:calendar-due" :width="20" :height="20"
              class="text-slate-500/20 group-hover:text-slate-500 transition-colors"
            />
          </div>
          <DataTooltip
            as="span" placement="top" :content="upcomingTooltip"
            class="min-w-0" content-class="whitespace-pre px-2 py-1 left-0 -translate-x-0 leading-normal"
          >
            <Transition v-bind="metricSwitchTransitionProps">
              <div
                :key="`upcoming-${summaryTransitionKey}`" class="flex items-baseline gap-1"
                :style="getMetricSwitchStyle(4)"
              >
                <span class="text-md md:text-2xl font-bold leading-none tracking-tight" :class="upcoming.length > 0 ? 'text-yellow-600 dark:text-yellow-400' : ''">{{ upcoming.length }}</span>
                <span class="text-[11px] md:text-xs font-medium text-muted-foreground">张</span>
              </div>
            </Transition>
          </DataTooltip>
        </div>
      </CardX>
      <CardX
        hoverable
        class="group h-full border-none rounded-md transition-all"
        :class="[
          pickSurfaceClass('bg-background/60 hover:bg-background', 'bg-background/50 hover:bg-background backdrop-blur-xs'),
          showVisualPanel ? 'col-span-4 row-span-1 col-start-9 row-start-2' : 'col-span-1 row-start-2 col-start-3 min-h-18 md:min-h-24 md:row-start-1 md:col-start-6',
        ]"
        content-class="h-full !p-3"
      >
        <div class="flex h-full flex-col justify-between gap-1">
          <div class="flex items-start justify-between">
            <span class="text-xs font-medium tracking-wider text-muted-foreground">即将续费</span>
            <Icon
              icon="tabler:hourglass" :width="20" :height="20"
              class="text-slate-500/20 group-hover:text-slate-500 transition-colors"
            />
          </div>
          <Transition v-bind="metricSwitchTransitionProps">
            <div
              :key="`next-${summaryTransitionKey}`" class="flex items-baseline gap-1 min-w-0"
              :style="getMetricSwitchStyle(5)"
            >
              <template v-if="nextRenewalText">
                <span class="text-md md:text-2xl font-bold leading-none tracking-tight">
                  {{ nextRenewalText.value }}
                </span>
                <span class="text-[11px] md:text-xs font-medium text-muted-foreground truncate">{{ nextRenewalText.unit }}</span>
              </template>
              <span v-else class="text-md md:text-2xl font-bold leading-none tracking-tight">-</span>
            </div>
          </Transition>
        </div>
      </CardX>
    </div>
  </div>
</template>

<style scoped>
.metric-switch-enter-active,
.metric-switch-leave-active {
  transition:
    opacity 160ms ease,
    transform 180ms cubic-bezier(0.22, 1, 0.36, 1),
    filter 180ms ease;
}

.metric-switch-enter-active {
  transition-delay: var(--metric-switch-delay, 0ms);
}

.metric-switch-enter-from {
  opacity: 0;
  transform: translateY(6px);
  filter: blur(3px);
}

.metric-switch-leave-to {
  opacity: 0;
  transform: translateY(-4px);
  filter: blur(2px);
}

@media (prefers-reduced-motion: reduce) {
  .metric-switch-enter-active,
  .metric-switch-leave-active {
    transition: none;
    transition-delay: 0ms;
  }

  .metric-switch-enter-from,
  .metric-switch-leave-to {
    opacity: 1;
    transform: none;
    filter: none;
  }
}
</style>
