<script setup lang="ts">
import type { SimCard } from '@shared/types'
import type { CardStyle } from '@/stores/app'
import SimCardBar from '@/components/sim-card/SimCardBar.vue'
import SimCardDial from '@/components/sim-card/SimCardDial.vue'
import SimCardNamecard from '@/components/sim-card/SimCardNamecard.vue'

const props = defineProps<{
  card: SimCard
  cardStyle: CardStyle
}>()

const emit = defineEmits<{
  click: []
}>()

const STYLE_COMPONENTS = {
  namecard: SimCardNamecard,
  dial: SimCardDial,
  bar: SimCardBar,
} as const
</script>

<template>
  <component :is="STYLE_COMPONENTS[props.cardStyle]" :card="props.card" @click="emit('click')" />
</template>
