<script setup lang="ts">
import type { ValidityTone } from '@/utils/cardHelpers'
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { VALIDITY_TONE_TEXT } from '@/utils/cardHelpers'

/** Circular progress ring for remaining validity ratio, starting at 12 o'clock clockwise */

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
/* Unscoped: Vue's scoped CSS compiler strips the selector when using :global(.dark) as a prefix, applying rules to <html>. Classes are prefixed with .validity- to avoid collisions. */
.validity-arc-animated {
  animation: validity-arc-in 1s cubic-bezier(0.2, 0.7, 0.2, 1) both;
}

@keyframes validity-arc-in {
  from {
    stroke-dashoffset: var(--validity-arc);
  }
}

.dark .validity-arc {
  filter: drop-shadow(0 0 2px currentColor) drop-shadow(0 0 7px color-mix(in oklab, currentColor 55%, transparent));
}

@media (prefers-reduced-motion: reduce) {
  .validity-arc-animated {
    animation: none;
  }
}
</style>
