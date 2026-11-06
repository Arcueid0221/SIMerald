<script setup lang="ts">
import type { SimCard } from '@shared/types'
import { useI18n } from 'vue-i18n'
import CarrierLogo from '@/components/sim-card/CarrierLogo.vue'
import SimCardShell from '@/components/sim-card/SimCardShell.vue'
import SimInfoRows from '@/components/sim-card/SimInfoRows.vue'
import StatusDot from '@/components/sim-card/StatusDot.vue'
import { DataTooltip } from '@/components/ui/data-tooltip'
import { useSimCardView } from '@/composables/useSimCardView'
import { VALIDITY_TONE_TEXT } from '@/utils/cardHelpers'

const props = defineProps<{ card: SimCard }>()
const emit = defineEmits<{
  click: []
}>()
/** Horizontal bar card layout, closest to the original Emerald server card */

const { t } = useI18n()
const { daysClass, daysText, inactive, inactiveClass, inactiveDate, inactiveLabel, keepRow, purchaseRow, subtitle, validity, validityTooltip } = useSimCardView(() => props.card)
</script>

<template>
  <SimCardShell :card="props.card" @click="emit('click')">
    <div class="flex items-center gap-3 px-4 pt-4 pb-3">
      <CarrierLogo :carrier="props.card.carrier" :src="props.card.logo" :size="38" class="rounded-[10px]" />
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
    </div>
    <div class="relative px-4 pb-4">
      <div
        v-if="inactive"
        class="absolute inset-0 z-10 flex flex-col items-center justify-center space-y-1 text-[11px] text-muted-foreground"
      >
        <span class="text-sm" :class="inactiveClass">{{ inactiveLabel }}</span>
        <div>{{ inactiveDate }}</div>
      </div>
      <div class="flex flex-col gap-3" :class="inactive && 'pointer-events-none opacity-60 blur-xs'">
        <div class="flex flex-col gap-1">
          <div class="flex w-full justify-between text-xs">
            <span class="text-muted-foreground">{{ t('card.validity') }}</span>
            <DataTooltip :content="validityTooltip" placement="left" content-class="whitespace-nowrap px-1.5 text-[11px]">
              <span class="tabular-nums" :class="daysClass">{{ daysText }}</span>
            </DataTooltip>
          </div>
          <div class="relative h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              class="h-full rounded-full bg-current transition-[width] duration-300 ease-out dark:shadow-[0_0_9px_currentColor]"
              :class="VALIDITY_TONE_TEXT[validity.tone]"
              :style="{ width: `${Math.max(2, validity.ratio * 100)}%` }"
            />
          </div>
          <div class="flex justify-between gap-2 text-[11px] text-muted-foreground">
            <span class="truncate">{{ t('card.until', { date: props.card.expiresAt ?? '-' }) }}</span>
            <span v-if="validity.total" class="shrink-0">{{ t('card.thisPeriod', { days: t('days.count', validity.total) }) }}</span>
          </div>
        </div>
        <SimInfoRows :rows="[purchaseRow, keepRow]" />
      </div>
    </div>
  </SimCardShell>
</template>
