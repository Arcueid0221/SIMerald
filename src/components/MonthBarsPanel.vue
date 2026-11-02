<script setup lang="ts">
import type { MonthBar } from '@/utils/cardHelpers'
import { DataTooltip } from '@/components/ui/data-tooltip'

/**
 * 卡片底部的月份小条：外观沿用 Emerald 的「延迟 / 丢包」面板，
 * 每一格代表一个月，有色表示那个月有消费或需要续费。
 */
const props = defineProps<{
  label: string
  display: string
  bars: MonthBar[]
  a11yLabel: string
}>()

const emit = defineEmits<{ open: [] }>()
</script>

<template>
  <div
    role="button" tabindex="0"
    class="group/panel relative col-span-3 flex h-6 cursor-pointer flex-col gap-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    :aria-label="props.a11yLabel" @click.stop="emit('open')"
    @keydown.enter.stop.prevent="emit('open')" @keydown.space.stop.prevent="emit('open')"
  >
    <div class="flex items-center justify-between text-[11px] leading-none relative">
      <span class="text-muted-foreground">{{ props.label }}</span>
      <div class="border-t-2 border-dotted border-gray-500/10 mx-2 flex-1" />
      <span class="font-medium text-foreground/85">{{ props.display }}</span>
    </div>
    <div
      class="grid h-full items-end gap-[1px]"
      :style="{ gridTemplateColumns: `repeat(${props.bars.length}, minmax(0, 1fr))` }"
    >
      <DataTooltip
        v-for="bar in props.bars" :key="bar.key" placement="top" :content="bar.tooltip"
        class="h-full w-full" content-class="whitespace-pre-wrap w-max px-1.5 !leading-[1.2] text-[11px]"
      >
        <span
          class="block h-full w-full rounded-[1px] transition-transform duration-150 group-hover/data-tooltip:scale-y-200"
          :class="bar.className"
        />
      </DataTooltip>
    </div>
  </div>
</template>
