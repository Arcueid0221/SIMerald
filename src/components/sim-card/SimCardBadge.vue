<script setup lang="ts">
import type { SimCard } from '@shared/types'
import CarrierLogo from '@/components/sim-card/CarrierLogo.vue'
import SimCardShell from '@/components/sim-card/SimCardShell.vue'
import SimInfoRows from '@/components/sim-card/SimInfoRows.vue'
import StatusDot from '@/components/sim-card/StatusDot.vue'
import ValidityRing from '@/components/sim-card/ValidityRing.vue'
import { DataTooltip } from '@/components/ui/data-tooltip'
import { useSimCardView } from '@/composables/useSimCardView'

/** 徽章：套着圆环的 Logo 放在左边，天数在标题行最右边，正文三行虚线 */

const props = defineProps<{ card: SimCard }>()

const emit = defineEmits<{
  click: []
}>()

const { daysClass, daysText, expiryRow, inactive, inactiveClass, inactiveLabel, keepRow, purchaseRow, subtitle, validity, validityTooltip } = useSimCardView(() => props.card)
</script>

<template>
  <SimCardShell :card="props.card" @click="emit('click')">
    <div class="flex items-center gap-3 px-4 pt-4 pb-3.5">
      <DataTooltip :content="validityTooltip" placement="top" content-class="whitespace-nowrap px-1.5 text-[11px]">
        <ValidityRing :size="54" :stroke="3" :ratio="validity.ratio" :tone="validity.tone">
          <CarrierLogo :carrier="props.card.carrier" :src="props.card.logo" :size="40" class="rounded-full" />
        </ValidityRing>
      </DataTooltip>
      <div class="min-w-0 flex-1">
        <div class="flex min-w-0 items-center gap-2">
          <StatusDot :status="props.card.status" />
          <div class="truncate text-base font-bold">
            {{ props.card.carrier }}
          </div>
        </div>
        <div class="mt-0.5 truncate text-[11px] text-muted-foreground">
          {{ subtitle }}
        </div>
      </div>
      <div class="shrink-0 text-right">
        <span v-if="inactive" class="text-xs" :class="inactiveClass">{{ inactiveLabel }}</span>
        <template v-else>
          <span class="text-[22px] leading-none font-semibold tracking-tight tabular-nums" :class="daysClass">{{ daysText }}</span>
          <span class="text-[11px] text-muted-foreground"> 天</span>
        </template>
      </div>
    </div>
    <div class="px-4 pb-4" :class="inactive && 'pointer-events-none opacity-60 blur-xs'">
      <SimInfoRows :rows="[expiryRow, purchaseRow, keepRow]" />
    </div>
  </SimCardShell>
</template>
