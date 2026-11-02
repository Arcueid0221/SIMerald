<script setup lang="ts">
import type { SimCard } from '@shared/types'
import { Icon } from '@iconify/vue'
import { computed, ref } from 'vue'
import RenewalListCell from '@/components/RenewalListCell.vue'
import { Badge } from '@/components/ui/badge'
import { DataTooltip } from '@/components/ui/data-tooltip'
import { ProgressThin } from '@/components/ui/progress-thin'
import { useBackgroundSurface } from '@/composables/useBackgroundSurface'
import { useAppStore } from '@/stores/app'
import { useCardsStore } from '@/stores/cards'
import {
  formatCNY,
  getBalanceInfo,
  getCardTags,
  getHoldInfo,
  getNumberDisplay,
  getRenewalBarStatus,
  getRenewalDays,
  getRenewalDaysText,
  getRenewalTextClass,
  getValidityPercent,
  isBalanceStale,
  shortTypeLabel,
} from '@/utils/cardHelpers'
import { getKindIcon, getKindName, getTypeColorClass } from '@/utils/cardTypeHelper'
import { getFlagSrc, getRegionDisplayName } from '@/utils/regionHelper'

interface ColumnConfig {
  key: string
  label: string
  width: string | number
  sortable: boolean
}

const props = defineProps<{
  cards: SimCard[]
  transitionKey?: string
}>()

const emit = defineEmits<{
  click: [card: SimCard]
  historyClick: [card: SimCard]
}>()

const rowStaggerMs = 35
const rowStaggerLimit = 12

const appStore = useAppStore()
const cardsStore = useCardsStore()
const { pickSurfaceClass } = useBackgroundSurface()

const columns: ColumnConfig[] = [
  { key: 'status', label: '状态', width: '40px', sortable: true },
  { key: 'type', label: '类型', width: '40px', sortable: true },
  { key: 'name', label: '卡片', width: 'minmax(160px, 1fr)', sortable: true },
  { key: 'tags', label: '标签', width: 'minmax(180px, 1fr)', sortable: false },
  { key: 'validity', label: '有效期', width: '100px', sortable: true },
  { key: 'balance', label: '余额', width: '100px', sortable: true },
  { key: 'hold', label: '持有', width: '100px', sortable: true },
  { key: 'spend', label: '花费', width: '100px', sortable: true },
  { key: 'number', label: '号码', width: '80px', sortable: false },
  { key: 'renewal', label: '续费', width: '136px', sortable: false },
]

const sortKey = ref<string>('')
const sortDir = ref<1 | -1>(1)

function handleSort(col: ColumnConfig) {
  if (!col.sortable)
    return
  if (sortKey.value === col.key) {
    sortDir.value = sortDir.value === 1 ? -1 : 1
  }
  else {
    sortKey.value = col.key
    sortDir.value = 1
  }
}

const STATUS_ORDER = { active: 2, expired: 1, cancelled: 0 } as const

const sortedCards = computed(() => {
  const cards = [...props.cards]
  const key = sortKey.value
  const dir = sortDir.value
  if (!key)
    return cards
  return cards.sort((a, b) => {
    switch (key) {
      case 'status': return dir * (STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
      case 'type': return dir * a.type.localeCompare(b.type, 'zh-CN')
      case 'name': return dir * a.name.localeCompare(b.name, 'zh-CN')
      case 'validity': return dir * ((getRenewalDays(a) ?? Infinity) - (getRenewalDays(b) ?? Infinity))
      case 'balance': return dir * (getBalanceInfo(a).percent - getBalanceInfo(b).percent)
      case 'hold': return dir * ((getHoldInfo(a).days ?? 0) - (getHoldInfo(b).days ?? 0))
      case 'spend': return dir * ((a.totalSpentCNY ?? 0) - (b.totalSpentCNY ?? 0))
      default: return 0
    }
  })
})

const columnKeys = computed(() => columns.map(c => c.key))

const gridStyle = computed(() => ({
  gridTemplateColumns: columns.map(c => c.width).join(' '),
}))

const inactiveOverlayContentStyle = computed(() => {
  const keys = columnKeys.value
  const nameIndex = keys.indexOf('name')
  return { gridColumn: `${nameIndex === -1 ? 1 : nameIndex + 1} / -1` }
})

function spendPercent(card: SimCard): number {
  return cardsStore.maxSpendCNY > 0 ? (card.totalSpentCNY ?? 0) / cardsStore.maxSpendCNY * 100 : 0
}

function dotClass(card: SimCard): string {
  return card.status === 'active' ? 'bg-emerald-600' : card.status === 'cancelled' ? 'bg-slate-400' : 'bg-red-600'
}

function handleClick(card: SimCard) {
  emit('click', card)
}

function getRowTransitionKey(card: SimCard): string {
  return props.transitionKey ? `${props.transitionKey}-${card.id}` : card.id
}

function getRowTransitionStyle(index: number): Record<string, string> {
  return {
    '--node-row-delay': `${Math.min(index, rowStaggerLimit) * rowStaggerMs}ms`,
  }
}
</script>

<template>
  <div class="overflow-x-auto overflow-y-hidden min-w-0 p-1 -m-1">
    <div class="min-w-fit w-full flex flex-col gap-1">
      <!-- 表头 -->
      <div
        class="grid gap-2 rounded-lg p-2"
        :class="pickSurfaceClass('bg-background/60 hover:bg-background', 'bg-background/60 backdrop-blur-sm')"
        :style="gridStyle"
      >
        <div
          v-for="col in columns" :key="col.key"
          :class="[col.sortable ? 'cursor-pointer' : '', ['status', 'type'].includes(col.key) ? 'text-center' : 'text-left']"
          @click="handleSort(col)"
        >
          <span class="text-xs text-muted-foreground">
            {{ col.label }}{{ col.sortable && sortKey === col.key ? (sortDir === 1 ? ' ↑' : ' ↓') : '' }}
          </span>
        </div>
      </div>

      <TransitionGroup
        :appear="!appStore.disablePageAnimation"
        :css="!appStore.disablePageAnimation"
        name="node-row-switch"
        tag="div"
        class="flex flex-col gap-1"
      >
        <div
          v-for="(card, index) in sortedCards"
          :key="getRowTransitionKey(card)"
          class="relative flex h-16 cursor-pointer flex-col justify-center rounded-lg px-2 shadow-[0_0_4px,0_0_0_1px] shadow-transparent transition-all bg-background/60 hover:bg-background hover:shadow-emerald-600/10"
          :class="[pickSurfaceClass('', 'backdrop-blur-sm'), card.status === 'expired' && '!shadow-red-600/10', card.status === 'cancelled' && '!shadow-slate-500/10']"
          :style="getRowTransitionStyle(index)"
          @click="handleClick(card)"
        >
          <div class="grid gap-2 items-center" :style="gridStyle">
            <template v-for="col in columns" :key="col.key">
              <!-- 状态指示器 -->
              <div v-if="col.key === 'status'" class="flex justify-center">
                <div class="size-2 rounded-full relative" :class="dotClass(card)">
                  <div
                    v-if="card.status !== 'cancelled'"
                    class="animate-ping absolute inset-0 rounded-full opacity-50"
                    :class="dotClass(card)"
                  />
                </div>
              </div>

              <!-- 卡片名称 -->
              <div v-else-if="col.key === 'name'" class="space-y-0.5" :class="[card.status !== 'active' && 'blur-sm opacity-30']">
                <div class="flex gap-1 items-center text-xs font-semibold">
                  <img
                    v-if="card.region" :src="getFlagSrc(card.region)"
                    :alt="getRegionDisplayName(card.region)" class="size-5 rounded-sm"
                  >
                  <span class="truncate">{{ card.name }}</span>
                </div>
                <div class="flex flex-row text-[11px] text-muted-foreground/70">
                  <DataTooltip
                    v-if="getHoldInfo(card).days !== null" :content="getHoldInfo(card).sub" class="shrink-0" placement="right"
                    content-class="whitespace-pre-wrap left-0 ml-0 w-max"
                  >
                    <span>持有 {{ getHoldInfo(card).days }} 天</span>
                  </DataTooltip>
                  <div class="truncate">
                    <span class="mx-1">·</span>
                    <span>{{ shortTypeLabel(card.type) }}</span>
                  </div>
                </div>
              </div>

              <!-- 标签 -->
              <div v-else-if="col.key === 'tags'">
                <div class="flex flex-wrap gap-1 items-center">
                  <Badge
                    v-for="(tag, tagIndex) in getCardTags(card)" :key="tagIndex" variant="outline"
                    class="!text-[11px] rounded text-muted-foreground border-muted-foreground/10 px-1.5"
                  >
                    {{ tag }}
                  </Badge>
                </div>
              </div>

              <!-- 续费 -->
              <div v-else-if="col.key === 'renewal'" class="flex flex-col gap-0.5">
                <RenewalListCell
                  :card="card"
                  role="button"
                  tabindex="0"
                  class="outline-none"
                  :aria-label="`${card.name} 续费记录`"
                  @click.stop="emit('historyClick', card)"
                  @keydown.enter.stop.prevent="emit('historyClick', card)"
                  @keydown.space.stop.prevent="emit('historyClick', card)"
                />
              </div>

              <!-- 卡片类型 -->
              <div v-else-if="col.key === 'type'" class="flex justify-center">
                <DataTooltip :content="getKindName(card.typeKind)" placement="top" content-class="whitespace-nowrap text-[11px] px-2">
                  <Icon :icon="getKindIcon(card.typeKind)" :width="16" :height="16" :class="getTypeColorClass(card.typeColor)" />
                </DataTooltip>
              </div>

              <!-- 有效期 -->
              <div v-else-if="col.key === 'validity'" class="group">
                <div class="space-y-1">
                  <div class="text-[10px] truncate" :class="getRenewalTextClass(card) || 'text-muted-foreground'">
                    <span class="inline group-hover:hidden">
                      {{ getRenewalDaysText(card) }}
                    </span>
                    <span class="hidden group-hover:inline">
                      {{ card.nextRenewalAt ?? card.expiresAt ?? '-' }}
                    </span>
                  </div>
                  <ProgressThin :percentage="getValidityPercent(card)" :status="getRenewalBarStatus(card)" :height="4" />
                </div>
              </div>

              <!-- 余额 -->
              <div v-else-if="col.key === 'balance'" class="group">
                <div class="space-y-1">
                  <div class="text-[10px] truncate" :class="isBalanceStale(card) ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground'">
                    <span class="inline group-hover:hidden">
                      {{ getBalanceInfo(card).text }}
                    </span>
                    <span class="hidden group-hover:inline">
                      {{ getBalanceInfo(card).sub }}
                    </span>
                  </div>
                  <ProgressThin :percentage="getBalanceInfo(card).percent" :status="getBalanceInfo(card).status" :height="4" />
                </div>
              </div>

              <!-- 持有 -->
              <div v-else-if="col.key === 'hold'" class="group">
                <div class="space-y-1">
                  <div class="text-[10px] text-muted-foreground truncate">
                    <span class="inline group-hover:hidden">
                      {{ getHoldInfo(card).days === null ? '-' : `${getHoldInfo(card).days} 天` }}
                    </span>
                    <span class="hidden group-hover:inline">
                      {{ getHoldInfo(card).sub }}
                    </span>
                  </div>
                  <ProgressThin :percentage="getHoldInfo(card).percent" status="info" :height="4" />
                </div>
              </div>

              <!-- 花费 -->
              <div v-else-if="col.key === 'spend'">
                <div class="space-y-1">
                  <div class="text-[10px] text-muted-foreground truncate">
                    {{ formatCNY(card.totalSpentCNY ?? 0) }}
                  </div>
                  <ProgressThin :percentage="spendPercent(card)" status="success" :height="4" />
                </div>
              </div>

              <!-- 号码 -->
              <div v-else-if="col.key === 'number'">
                <div class="text-[10px] flex flex-col">
                  <span class="font-mono truncate">{{ getNumberDisplay(card) }}</span>
                  <span class="text-muted-foreground truncate">{{ card.countryName || '-' }}</span>
                </div>
              </div>
            </template>
          </div>

          <div
            v-if="card.status !== 'active'" class="absolute inset-0 z-2 p-2 bg-background/10 rounded-lg flex items-center"
            aria-hidden="true"
          >
            <div class="grid gap-2 items-center justify-center" :style="gridStyle">
              <div class="h-full space-y-1" :style="inactiveOverlayContentStyle">
                <div class="text-sm font-semibold truncate">
                  <span :class="card.status === 'cancelled' ? 'text-slate-500' : 'text-red-500'">{{ card.status === 'cancelled' ? '已注销' : '已过期' }}</span> {{ card.name }}
                </div>
                <div class="text-xs text-muted-foreground">
                  {{ card.status === 'cancelled' ? card.cancelledAt : card.expiresAt }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.node-row-switch-enter-active,
.node-row-switch-leave-active {
  transition:
    opacity 170ms ease,
    transform 210ms cubic-bezier(0.22, 1, 0.36, 1),
    filter 170ms ease;
}

.node-row-switch-enter-active {
  transition-delay: var(--node-row-delay, 0ms);
}

.node-row-switch-move {
  transition: transform 210ms cubic-bezier(0.22, 1, 0.36, 1);
}

.node-row-switch-enter-from {
  opacity: 0;
  transform: translateY(8px);
  filter: blur(3px);
}

.node-row-switch-leave-to {
  opacity: 0;
  transform: translateY(-5px);
  filter: blur(2px);
}

@media (prefers-reduced-motion: reduce) {
  .node-row-switch-enter-active,
  .node-row-switch-leave-active,
  .node-row-switch-move {
    transition: none;
    transition-delay: 0ms;
  }

  .node-row-switch-enter-from,
  .node-row-switch-leave-to {
    opacity: 1;
    transform: none;
    filter: none;
  }
}
</style>
