<script setup lang="ts">
import type { SimCard } from '@shared/types'
import type { CardStyle } from '@/stores/app'
import SimCardBadge from '@/components/sim-card/SimCardBadge.vue'
import SimCardBar from '@/components/sim-card/SimCardBar.vue'
import SimCardDial from '@/components/sim-card/SimCardDial.vue'
import SimCardNamecard from '@/components/sim-card/SimCardNamecard.vue'

/** 首页的一张卡；样式由访客在首页右上角选择（名片 / 徽章 / 表盘 / 横条） */

const props = defineProps<{
  card: SimCard
  cardStyle: CardStyle
}>()

const emit = defineEmits<{
  click: []
}>()

const STYLE_COMPONENTS = {
  namecard: SimCardNamecard,
  badge: SimCardBadge,
  dial: SimCardDial,
  bar: SimCardBar,
} as const
</script>

<template>
  <component :is="STYLE_COMPONENTS[props.cardStyle]" :card="props.card" @click="emit('click')" />
</template>
