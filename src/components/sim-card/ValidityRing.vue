<script setup lang="ts">
import type { ValidityTone } from '@/utils/cardHelpers'
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { VALIDITY_TONE_TEXT } from '@/utils/cardHelpers'

/** 有效期圆环：弧长 = 本期还剩几成，从正上方顺时针走；中间放 Logo 或天数 */

const props = defineProps<{
  size: number
  stroke: number
  ratio: number
  tone: ValidityTone
}>()

const appStore = useAppStore()

const center = computed(() => props.size / 2)
const radius = computed(() => props.size / 2 - props.stroke / 2 - 0.5)
const circumference = computed(() => 2 * Math.PI * radius.value)
const arc = computed(() => Math.max(0, Math.min(1, props.ratio)) * circumference.value)
</script>

<template>
  <div class="relative shrink-0" :style="{ width: `${props.size}px`, height: `${props.size}px` }">
    <svg
      class="absolute inset-0 -rotate-90"
      :viewBox="`0 0 ${props.size} ${props.size}`"
      :width="props.size"
      :height="props.size"
      aria-hidden="true"
    >
      <circle :cx="center" :cy="center" :r="radius" fill="none" class="stroke-muted" :stroke-width="props.stroke" />
      <circle
        v-if="arc > 0"
        class="validity-arc stroke-current"
        :class="[VALIDITY_TONE_TEXT[props.tone], !appStore.disablePageAnimation && 'validity-arc-animated']"
        :cx="center"
        :cy="center"
        :r="radius"
        fill="none"
        :stroke-width="props.stroke"
        stroke-linecap="round"
        :stroke-dasharray="`${arc} ${circumference}`"
        :style="{ '--validity-arc': `${arc}` }"
      />
    </svg>
    <div class="absolute inset-0 flex flex-col items-center justify-center leading-none">
      <slot />
    </div>
  </div>
</template>

<style>
/* 不用 scoped：scoped 里写 :global(.dark) 前缀时，Vue 会把整条选择器换成 .dark，规则就落到了 <html> 上。这里的类名都带前缀，不会和别处冲突 */
.validity-arc-animated {
  animation: validity-arc-in 1s cubic-bezier(0.2, 0.7, 0.2, 1) both;
}

@keyframes validity-arc-in {
  from {
    stroke-dashoffset: var(--validity-arc);
  }
}

/* 深色模式的「夜光」：弧线带一点同色微光 */
.dark .validity-arc {
  filter: drop-shadow(0 0 2px currentColor) drop-shadow(0 0 7px color-mix(in oklab, currentColor 55%, transparent));
}

@media (prefers-reduced-motion: reduce) {
  .validity-arc-animated {
    animation: none;
  }
}
</style>
