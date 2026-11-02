<script setup lang="ts">
import type { SimCard } from '@shared/types'
import { Icon } from '@iconify/vue'
import { computed } from 'vue'
import MonthBarsPanel from '@/components/MonthBarsPanel.vue'
import { Badge } from '@/components/ui/badge'
import { CardX } from '@/components/ui/card-x'
import { DataTooltip } from '@/components/ui/data-tooltip'
import { ProgressThin } from '@/components/ui/progress-thin'
import { useBackgroundSurface } from '@/composables/useBackgroundSurface'
import { useExchangeRates } from '@/composables/useExchangeRates'
import { useCardsStore } from '@/stores/cards'
import {
  formatCNY,
  getAnnualCostCNY,
  getBalanceInfo,
  getCardTags,
  getHistoryBars,
  getHoldInfo,
  getNumberDisplay,
  getPlanBars,
  getPriceTags,
  getRenewalBarStatus,
  getRenewalDaysText,
  getRenewalTextClass,
  getRenewalTooltip,
  getValidityPercent,
  isBalanceStale,
  shortTypeLabel,
} from '@/utils/cardHelpers'
import { getKindIcon, getKindName, getTypeColorClass } from '@/utils/cardTypeHelper'
import { getFlagSrc, getRegionDisplayName } from '@/utils/regionHelper'

const props = defineProps<{ card: SimCard }>()

const emit = defineEmits<{
  click: []
  historyClick: [card: SimCard]
}>()

const { pickSurfaceClass } = useBackgroundSurface()
const { rates } = useExchangeRates()
const cardsStore = useCardsStore()

const isActive = computed(() => props.card.status === 'active')
const isCancelled = computed(() => props.card.status === 'cancelled')
const dotClass = computed(() => isActive.value ? 'bg-emerald-600' : isCancelled.value ? 'bg-slate-400' : 'bg-red-600')

const validityPercent = computed(() => getValidityPercent(props.card))
const validityStatus = computed(() => getRenewalBarStatus(props.card))
const renewalDate = computed(() => props.card.nextRenewalAt ?? props.card.expiresAt)

const balance = computed(() => getBalanceInfo(props.card))
const balanceStale = computed(() => isBalanceStale(props.card))
const hold = computed(() => getHoldInfo(props.card))

const spendCNY = computed(() => props.card.totalSpentCNY ?? 0)
const spendPercent = computed(() => cardsStore.maxSpendCNY > 0 ? spendCNY.value / cardsStore.maxSpendCNY * 100 : 0)
const annualCost = computed(() => getAnnualCostCNY(props.card, rates.value))

const priceTags = computed(() => getPriceTags(props.card))
const renewalTextClass = computed(() => getRenewalTextClass(props.card))
const renewalTooltip = computed(() => getRenewalTooltip(props.card))
const keepAliveText = computed(() => props.card.keepAlive.join('、') || '-')
const customTags = computed(() => getCardTags(props.card))

const historyBars = computed(() => getHistoryBars(props.card))
const planBars = computed(() => getPlanBars(props.card))
const historyDisplay = computed(() => `${historyBars.value.filter(b => b.active).length} 个月`)
const planDisplay = computed(() => {
  if (isCancelled.value)
    return '-'
  return annualCost.value > 0 ? `≈${formatCNY(annualCost.value, 0)}` : '免费'
})

const inactiveTitle = computed(() => isCancelled.value ? '已注销' : '已过期')
const inactiveTime = computed(() => isCancelled.value ? props.card.cancelledAt ?? '' : props.card.expiresAt ?? '')

function openHistory() {
  emit('historyClick', props.card)
}
</script>

<template>
  <CardX
    hoverable
    class="node-card h-full w-full cursor-pointer border-none shadow-[0_0_0_1px] shadow-transparent transition-all duration-200 rounded-md bg-background/60 hover:bg-background hover:shadow-emerald-600/10 hover:shadow-[0_0_20px,0_0_0_1px] hover:-translate-y-0.5 hover:z-1"
    :class="[
      pickSurfaceClass('', 'backdrop-blur-sm'),
      props.card.status === 'expired' && 'shadow-[0_0_0_1px] !shadow-red-600/20',
      isCancelled && 'shadow-[0_0_0_1px] !shadow-slate-500/15',
    ]"
    @click="emit('click')"
  >
    <template #header>
      <div class="flex gap-2 min-w-0 items-center">
        <div class="size-2 rounded-full relative" :class="dotClass">
          <div
            v-if="!isCancelled"
            class="animate-ping absolute inset-0 rounded-full opacity-50"
            :class="dotClass"
          />
        </div>
        <div class="text-md font-bold flex-1 min-w-0 truncate">
          {{ props.card.name }}
        </div>
      </div>
    </template>

    <template #header-extra>
      <div class="flex gap-2 items-center">
        <DataTooltip :content="getKindName(props.card.typeKind)" placement="top" content-class="whitespace-nowrap text-[11px] px-2">
          <Icon
            :icon="getKindIcon(props.card.typeKind)" :width="16" :height="16"
            :class="getTypeColorClass(props.card.typeColor)"
          />
        </DataTooltip>
        <img
          v-if="props.card.region" :src="getFlagSrc(props.card.region)"
          :alt="getRegionDisplayName(props.card.region)" class="size-5 shrink-0"
        >
      </div>
    </template>

    <template #default>
      <div class="flex flex-col gap-3">
        <div class="gap-x-3 gap-y-1 grid grid-cols-2">
          <!-- 有效期 -->
          <div class="flex flex-col gap-1">
            <div class="w-full text-xs flex flex-row justify-between">
              <span class="text-muted-foreground">
                有效期
              </span>
              <span :class="renewalTextClass">{{ getRenewalDaysText(props.card) }}</span>
            </div>
            <ProgressThin :percentage="validityPercent" :status="validityStatus" :height="4" />
            <div class="text-[11px] text-muted-foreground truncate">
              {{ renewalDate ? `至 ${renewalDate}` : '没有有效期记录' }}
            </div>
          </div>

          <!-- 余额 -->
          <div class="flex flex-col gap-1">
            <div class="w-full text-xs flex flex-row justify-between">
              <span class="text-muted-foreground">
                余额
              </span>
              <span>{{ balance.text }}</span>
            </div>
            <ProgressThin :percentage="balance.percent" :status="balance.status" :height="4" />
            <div class="text-[11px] truncate" :class="balanceStale ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground'">
              {{ balance.sub }}
            </div>
          </div>

          <!-- 持有 -->
          <div class="flex flex-col gap-1">
            <div class="w-full text-xs flex flex-row justify-between">
              <span class="text-muted-foreground">
                持有
              </span>
              <span>{{ hold.days === null ? '-' : `${hold.days} 天` }}</span>
            </div>
            <ProgressThin :percentage="hold.percent" status="info" :height="4" />
            <div class="text-[11px] text-muted-foreground truncate">
              {{ hold.sub }}
            </div>
          </div>

          <!-- 花费 -->
          <div class="flex flex-col gap-1">
            <div class="w-full text-xs flex flex-row justify-between">
              <span class="text-muted-foreground">
                花费
              </span>
              <span>{{ formatCNY(spendCNY) }}</span>
            </div>
            <ProgressThin :percentage="spendPercent" status="success" :height="4" />
            <div class="text-[11px] text-muted-foreground truncate">
              {{ annualCost > 0 ? `保号约 ${formatCNY(annualCost, 0)}/年` : '保号不花钱' }}
            </div>
          </div>
        </div>
        <div class="relative text-[11px] text-muted-foreground">
          <div
            v-if="!isActive"
            class="absolute inset-0 z-10 flex flex-col items-center justify-center space-y-1"
          >
            <span class="text-sm" :class="isCancelled ? 'text-slate-500' : 'text-red-600'">{{ inactiveTitle }}</span>
            <div>{{ inactiveTime }}</div>
          </div>
          <div class="flex flex-col gap-y-2" :class="[!isActive && 'blur-xs opacity-60 pointer-events-none']">
            <div class="flex items-center">
              <span class="truncate">
                号码
              </span>
              <div class="border-t-2 border-dotted border-gray-500/10 mx-2 flex-1" />
              <span class="truncate font-mono tracking-tight text-foreground/85">{{ getNumberDisplay(props.card) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="truncate">
                类型
              </span>
              <div class="border-t-2 border-dotted border-gray-500/10 mx-2 flex-1" />
              <span class="truncate">
                {{ shortTypeLabel(props.card.type) }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="truncate">
                费用
              </span>
              <div class="border-t-2 border-dotted border-gray-500/10 mx-2 flex-1" />
              <DataTooltip placement="left" :content="renewalTooltip" content-class="whitespace-nowrap right-0 mr-0">
                <span class="truncate flex flex-row gap-1">
                  <template v-for="(tag, index) in priceTags" :key="tag.text">
                    <span class="inline-flex flex-row gap-1 items-center">
                      <span :class="tag.highlight ? renewalTextClass : ''">{{ tag.text }}</span>
                    </span>
                    <span v-if="index < priceTags.length - 1">·</span>
                  </template>
                </span>
              </DataTooltip>
            </div>
            <div class="flex items-center justify-between">
              <span class="truncate shrink-0">
                保号
              </span>
              <div class="border-t-2 border-dotted border-gray-500/10 mx-2 flex-1 min-w-4" />
              <DataTooltip placement="left" :content="keepAliveText" class="min-w-0" content-class="whitespace-nowrap right-0 mr-0">
                <span class="block truncate">{{ keepAliveText }}</span>
              </DataTooltip>
            </div>
            <div class="grid grid-cols-6 gap-x-3">
              <MonthBarsPanel
                label="续费" :display="historyDisplay" :bars="historyBars"
                :a11y-label="`${props.card.name} 近 12 个月消费`" @open="openHistory"
              />
              <MonthBarsPanel
                label="计划" :display="planDisplay" :bars="planBars"
                :a11y-label="`${props.card.name} 未来 12 个月续费`" @open="openHistory"
              />
            </div>
          </div>
        </div>
        <div v-if="customTags.length > 0" class="flex shrink-0 flex-wrap gap-1 items-center">
          <Badge
            v-for="(tag, index) in customTags" :key="index" variant="outline"
            class="!text-[11px] rounded text-muted-foreground border-muted-foreground/10 px-1.5"
          >
            {{ tag }}
          </Badge>
        </div>
      </div>
    </template>
  </CardX>
</template>

<style scoped>
.node-card {
  position: relative;
}
</style>
