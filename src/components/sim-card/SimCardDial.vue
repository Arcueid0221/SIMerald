<script setup lang="ts">
import type { SimCard } from '@shared/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import CarrierLogo from '@/components/sim-card/CarrierLogo.vue'
import SimCardShell from '@/components/sim-card/SimCardShell.vue'
import SimInfoRows from '@/components/sim-card/SimInfoRows.vue'
import StatusDot from '@/components/sim-card/StatusDot.vue'
import ValidityRing from '@/components/sim-card/ValidityRing.vue'
import { DataTooltip } from '@/components/ui/data-tooltip'
import { useSimCardView } from '@/composables/useSimCardView'

const props = defineProps<{ card: SimCard }>()
const emit = defineEmits<{
  click: []
}>()
/** Dial card layout: header with a circular remaining-days gauge and dotted info rows */

const { t } = useI18n()
const { daysClass, expiryRow, inactive, keepRow, purchaseRow, subtitle, validity, validityTooltip } = useSimCardView(() => props.card)

/** The ring only fits a number; clamp negative days to 0 and rely on color/tooltip for expired state */
const dialNumber = computed(() => {
  const left = validity.value.left
  return left === null ? '-' : String(Math.max(left, 0))
})
</script>

<template>
  <SimCardShell :card="props.card" @click="emit('click')">
    <div class="flex items-center gap-3 px-4 pt-4 pb-3.5">
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
      <DataTooltip :content="validityTooltip" placement="top" content-class="whitespace-nowrap px-1.5 text-[11px]">
        <ValidityRing :size="46" :stroke="3" :ratio="validity.ratio" :tone="validity.tone">
          <span v-if="inactive" class="text-[10px] text-muted-foreground">{{ t(`status.short.${props.card.status === 'cancelled' ? 'cancelled' : 'expired'}`) }}</span>
          <template v-else>
            <span
              class="font-semibold tracking-tight tabular-nums"
              :class="[daysClass, dialNumber.length > 3 ? 'text-xs' : 'text-[15px]']"
            >{{ dialNumber }}</span>
            <span class="mt-0.5 text-[10px] text-muted-foreground">{{ t('days.unit', validity.left ?? 0) }}</span>
          </template>
        </ValidityRing>
      </DataTooltip>
    </div>
    <div class="px-4 pb-4" :class="inactive && 'pointer-events-none opacity-60 blur-xs'">
      <SimInfoRows :rows="[expiryRow, purchaseRow, keepRow]" />
    </div>
  </SimCardShell>
</template>
