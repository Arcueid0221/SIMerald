<script setup lang="ts">
import type { SimCard } from '@shared/types'
import { useI18n } from 'vue-i18n'
import CarrierLogo from '@/components/sim-card/CarrierLogo.vue'
import SimCardShell from '@/components/sim-card/SimCardShell.vue'
import StatusDot from '@/components/sim-card/StatusDot.vue'
import ValidityRing from '@/components/sim-card/ValidityRing.vue'
import { DataTooltip } from '@/components/ui/data-tooltip'
import { useSimCardView } from '@/composables/useSimCardView'

const props = defineProps<{ card: SimCard }>()
const emit = defineEmits<{
  click: []
}>()
/** Vertical namecard layout: centered logo inside a validity ring with a 3-column footer */

const { t } = useI18n()
const { daysClass, daysText, inactive, inactiveClass, inactiveDate, inactiveLabel, keepCost, purchaseText, purchaseTooltip, subtitle, validity, validityTooltip } = useSimCardView(() => props.card)
</script>

<template>
  <SimCardShell :card="props.card" @click="emit('click')">
    <div class="flex flex-1 flex-col items-center px-4 pt-6 pb-4 text-center">
      <DataTooltip :content="validityTooltip" placement="top" content-class="whitespace-nowrap px-1.5 text-[11px]">
        <ValidityRing :size="92" :stroke="4" :ratio="validity.ratio" :tone="validity.tone">
          <CarrierLogo :carrier="props.card.carrier" :src="props.card.logo" :size="64" class="rounded-full" />
        </ValidityRing>
      </DataTooltip>

      <div class="mt-3.5 flex max-w-full items-center gap-2">
        <StatusDot :status="props.card.status" />
        <div class="truncate text-base font-bold">
          {{ props.card.carrier }}
        </div>
      </div>
      <div class="mt-0.5 max-w-full truncate text-[11px] text-muted-foreground">
        {{ subtitle }}
      </div>

      <div class="mt-auto w-full pt-4.5">
        <div
          v-if="inactive"
          class="border-t-2 border-dotted border-gray-500/10 pt-3.5 text-xs dark:border-white/8"
          :class="inactiveClass"
        >
          {{ inactiveLabel }}<template v-if="inactiveDate">
            · {{ inactiveDate }}
          </template>
        </div>
        <div v-else class="grid grid-cols-3 border-t-2 border-dotted border-gray-500/10 pt-3.5 dark:border-white/8">
          <div class="min-w-0 px-1">
            <div class="text-[11px] text-muted-foreground">
              {{ t('card.remaining') }}
            </div>
            <DataTooltip :content="validityTooltip" placement="top" class="max-w-full" content-class="whitespace-nowrap px-1.5 text-[11px]">
              <div class="mt-0.5 truncate text-[13px] font-medium tabular-nums" :class="daysClass">
                {{ daysText }}
              </div>
            </DataTooltip>
          </div>
          <div class="min-w-0 border-l border-border px-1">
            <div class="text-[11px] text-muted-foreground">
              {{ t('card.keepPerYear') }}
            </div>
            <DataTooltip :content="keepCost.tooltip" placement="top" class="max-w-full" content-class="whitespace-nowrap px-1.5 text-[11px]">
              <div class="mt-0.5 truncate text-[13px] font-medium tabular-nums">
                {{ keepCost.short }}
              </div>
            </DataTooltip>
          </div>
          <div class="min-w-0 border-l border-border px-1">
            <div class="text-[11px] text-muted-foreground">
              {{ t('card.rows.purchase') }}
            </div>
            <DataTooltip :content="purchaseTooltip" placement="top" class="max-w-full" content-class="whitespace-nowrap px-1.5 text-[11px]">
              <div class="mt-0.5 truncate text-[13px] font-medium tabular-nums">
                {{ purchaseText }}
              </div>
            </DataTooltip>
          </div>
        </div>
      </div>
    </div>
  </SimCardShell>
</template>
