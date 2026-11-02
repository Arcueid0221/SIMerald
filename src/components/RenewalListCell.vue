<script setup lang="ts">
import type { SimCard } from '@shared/types'
import { computed } from 'vue'
import { DataTooltip } from '@/components/ui/data-tooltip'
import { getHistoryBars, getPlanBars, getPriceTags, getRenewalTextClass, getRenewalTooltip } from '@/utils/cardHelpers'

/** 列表视图的「续费」列：外观沿用 Emerald 的三网延迟单元格 */
const props = defineProps<{
  card: SimCard
}>()

const historyBars = computed(() => getHistoryBars(props.card))
const planBars = computed(() => getPlanBars(props.card))
const priceTags = computed(() => getPriceTags(props.card))
const renewalTextClass = computed(() => getRenewalTextClass(props.card))
</script>

<template>
  <div class="flex flex-col">
    <DataTooltip
      placement="top" :content="getRenewalTooltip(props.card)"
      content-class="whitespace-pre-wrap w-max px-1.5 !leading-[1.2] text-[11px]"
    >
      <div class="truncate text-[10px]">
        <template v-for="(tag, index) in priceTags" :key="tag.text">
          <span v-if="index" class="mx-1">·</span>
          <span :class="tag.highlight ? renewalTextClass : ''">{{ tag.text }}</span>
        </template>
      </div>
    </DataTooltip>
    <div class="flex flex-col gap-[1px] w-full pr-4">
      <div v-for="(bars, rowIndex) in [historyBars, planBars]" :key="rowIndex" class="relative items-center gap-1">
        <div
          class="grid h-1 cursor-auto items-end gap-[1px] transition-all hover:h-2.5"
          :style="{ gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))` }"
        >
          <DataTooltip
            v-for="bar in bars" :key="bar.key" placement="top" :content="bar.tooltip"
            class="h-full w-full" content-class="whitespace-pre-wrap w-max px-1.5 !leading-[1.2] text-[11px]"
          >
            <span
              class="block h-full w-full rounded-[1px] transition-all hover:scale-y-160"
              :class="bar.className"
            />
          </DataTooltip>
        </div>
      </div>
    </div>
  </div>
</template>
