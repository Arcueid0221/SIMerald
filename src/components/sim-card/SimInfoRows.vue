<script setup lang="ts">
import type { SimInfoRow } from '@/composables/useSimCardView'
import { DataTooltip } from '@/components/ui/data-tooltip'

/** Key-value rows connected by a dotted leader line, styled after Emerald */

const props = defineProps<{ rows: SimInfoRow[] }>()
</script>

<template>
  <div class="flex flex-col gap-y-2 text-[11px] text-muted-foreground">
    <div v-for="row in props.rows" :key="row.label" class="flex items-center">
      <span class="shrink-0">{{ row.label }}</span>
      <div class="mx-2 flex-1 border-t-2 border-dotted border-gray-500/10 dark:border-white/8" />
      <DataTooltip
        v-if="row.tooltip" :content="row.tooltip" placement="left" class="min-w-0"
        content-class="whitespace-nowrap px-1.5 text-[11px]"
      >
        <span class="block truncate font-medium text-foreground/85">{{ row.value }}</span>
      </DataTooltip>
      <span v-else class="truncate font-medium text-foreground/85">{{ row.value }}</span>
    </div>
  </div>
</template>
