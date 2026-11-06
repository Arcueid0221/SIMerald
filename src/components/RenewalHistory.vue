<script setup lang="ts">
import type { RecordKind, SimCard, SimRecord } from '@shared/types'
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { CardX } from '@/components/ui/card-x'
import { Empty } from '@/components/ui/empty'
import { useBackgroundSurface } from '@/composables/useBackgroundSurface'
import { useAppStore } from '@/stores/app'
import { formatAmount, formatCNY } from '@/utils/cardHelpers'
import '@/utils/echarts'

/**
 * Renewal history for the detail page, replacing Emerald's load / ping charts:
 * a bar chart of spend (CNY) by date, followed by the itemized records.
 */
const props = defineProps<{
  card: SimCard
  /** Omit the outer card background when rendered inside a dialog */
  plain?: boolean
}>()

const appStore = useAppStore()
const { pickSurfaceClass } = useBackgroundSurface()
const isDark = computed(() => appStore.isDark)

const chartThemeColors = computed(() => ({
  text: isDark.value ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)',
  textSecondary: isDark.value ? 'rgba(255, 255, 255, 0.55)' : 'rgba(0, 0, 0, 0.55)',
  borderColor: isDark.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
  splitLineColor: isDark.value ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
  tooltipBg: isDark.value ? 'rgba(40, 40, 40, 0.95)' : 'rgba(255, 255, 255, 0.8)',
  tooltipShadow: isDark.value ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.06)',
}))

const TYPE_COLORS: Record<RecordKind, string> = {
  purchase: '#A78BFA',
  renewal: '#4ECDC4',
  topup: '#60A5FA',
  other: '#FFB347',
}

const records = computed<SimRecord[]>(() => [...props.card.history].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')))
const chartRecords = computed(() => [...records.value].filter(r => r.date).reverse())
const showAccounts = computed(() => records.value.some(r => r.accounts && r.accounts.length > 0))

function recordAmountText(record: SimRecord): string {
  if (record.amount === null)
    return '-'
  if (record.amount === 0)
    return '免费'
  return formatAmount(record.amount, record.currency)
}

const chartOption = computed(() => ({
  animation: !appStore.disablePageAnimation,
  grid: { top: 24, right: 16, bottom: 28, left: 48 },
  tooltip: {
    trigger: 'axis' as const,
    backgroundColor: chartThemeColors.value.tooltipBg,
    borderColor: 'transparent',
    borderWidth: 0,
    borderRadius: 6,
    textStyle: { color: chartThemeColors.value.text, fontSize: 12, lineHeight: 20 },
    extraCssText: `${appStore.backgroundEnabled ? 'backdrop-filter: blur(5px);' : ''}z-index:9;box-shadow:0 0 0 1px ${chartThemeColors.value.tooltipShadow}, 0 0 16px ${chartThemeColors.value.tooltipShadow}`,
    axisPointer: { type: 'shadow' as const, shadowStyle: { color: chartThemeColors.value.splitLineColor } },
    formatter: (params: unknown) => {
      const list = params as Array<{ dataIndex: number }>
      const record = chartRecords.value[list[0]?.dataIndex ?? -1]
      if (!record)
        return ''
      const color = TYPE_COLORS[record.kind]
      return [
        `<div style="font-weight:600">${record.date}</div>`,
        `<div style="display:flex;align-items:center;gap:6px"><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${color}"></span>${record.type || '消费'}</div>`,
        `<div>${recordAmountText(record)}${record.amountCNY !== null && record.currency !== 'CNY' && record.amount ? ` ≈ ${formatCNY(record.amountCNY)}` : ''}</div>`,
        record.extendsTo ? `<div style="color:${chartThemeColors.value.textSecondary}">有效期延至 ${record.extendsTo}</div>` : '',
      ].join('')
    },
  },
  xAxis: {
    type: 'category' as const,
    data: chartRecords.value.map(r => r.date),
    axisLabel: { fontSize: 11, color: chartThemeColors.value.textSecondary, margin: 12, hideOverlap: true },
    axisLine: { show: true, lineStyle: { color: chartThemeColors.value.borderColor, width: 1 } },
    axisTick: { show: false },
  },
  yAxis: {
    type: 'value' as const,
    axisLabel: { fontSize: 11, color: chartThemeColors.value.textSecondary, formatter: '¥{value}' },
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: chartThemeColors.value.splitLineColor, type: 'dashed' as const } },
  },
  series: [{
    type: 'bar' as const,
    barMaxWidth: 28,
    data: chartRecords.value.map(r => ({
      value: Math.round((r.amountCNY ?? 0) * 100) / 100,
      itemStyle: { color: TYPE_COLORS[r.kind], borderRadius: [3, 3, 0, 0] },
    })),
  }],
}))
</script>

<template>
  <CardX
    size="small"
    class="border-none transition-all rounded-md"
    :class="props.plain ? 'bg-transparent' : pickSurfaceClass('bg-background/60 hover:bg-background', 'bg-background/50 hover:bg-background backdrop-blur-xs')"
  >
    <template #header>
      <div class="flex items-center justify-between">
        <span class="text-base font-bold">续费历史</span>
        <div class="text-xs flex gap-1 items-baseline text-muted-foreground">
          <span>{{ records.length }} 笔</span>
          <span>·</span>
          <span class="text-foreground">{{ formatCNY(props.card.totalSpentCNY ?? 0) }}</span>
        </div>
      </div>
    </template>

    <div v-if="records.length === 0" class="py-4">
      <Empty description="还没有消费记录" />
    </div>
    <div v-else class="flex flex-col gap-3">
      <div class="h-48">
        <VChart :option="chartOption" autoresize />
      </div>
      <div class="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        <span class="flex items-center gap-1"><span class="inline-block size-2 rounded-[2px]" :style="{ background: TYPE_COLORS.purchase }" />首次购买</span>
        <span class="flex items-center gap-1"><span class="inline-block size-2 rounded-[2px]" :style="{ background: TYPE_COLORS.renewal }" />续费 / 保号</span>
        <span class="flex items-center gap-1"><span class="inline-block size-2 rounded-[2px]" :style="{ background: TYPE_COLORS.topup }" />额外充值</span>
        <span class="flex items-center gap-1"><span class="inline-block size-2 rounded-[2px]" :style="{ background: TYPE_COLORS.other }" />其他</span>
      </div>
      <div class="overflow-x-auto -mx-1 px-1">
        <table class="w-full min-w-[520px] text-xs">
          <thead>
            <tr class="text-muted-foreground text-left">
              <th class="font-normal py-1.5 pr-3">
                日期
              </th>
              <th class="font-normal py-1.5 pr-3">
                类型
              </th>
              <th class="font-normal py-1.5 pr-3 text-right">
                金额
              </th>
              <th class="font-normal py-1.5 pr-3 text-right">
                等额人民币
              </th>
              <th class="font-normal py-1.5 pr-3">
                有效期延至
              </th>
              <th v-if="showAccounts" class="font-normal py-1.5">
                扣款账户
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in records" :key="record.id" class="border-t border-border/60">
              <td class="py-1.5 pr-3 whitespace-nowrap">
                {{ record.date ?? '-' }}
              </td>
              <td class="py-1.5 pr-3 whitespace-nowrap">
                <span class="inline-flex items-center gap-1.5">
                  <span class="inline-block size-2 rounded-[2px]" :style="{ background: TYPE_COLORS[record.kind] }" />
                  {{ record.type || '-' }}
                </span>
              </td>
              <td class="py-1.5 pr-3 text-right whitespace-nowrap">
                {{ recordAmountText(record) }}
              </td>
              <td class="py-1.5 pr-3 text-right whitespace-nowrap text-muted-foreground">
                {{ record.amountCNY === null ? '-' : formatCNY(record.amountCNY) }}
              </td>
              <td class="py-1.5 pr-3 whitespace-nowrap">
                {{ record.extendsTo ?? '-' }}
              </td>
              <td v-if="showAccounts" class="py-1.5 whitespace-nowrap text-muted-foreground">
                {{ record.accounts?.join('、') || '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </CardX>
</template>
