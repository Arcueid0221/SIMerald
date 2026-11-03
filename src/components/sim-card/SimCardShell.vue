<script setup lang="ts">
import type { SimCard } from '@shared/types'
import { computed } from 'vue'
import { useBackgroundSurface } from '@/composables/useBackgroundSurface'
import { getFlagSrc } from '@/utils/regionHelper'

/**
 * Shared card shell with a SIM-style notched top-left corner and angled flag watermark.
 * Only the background layers are clipped so tooltips in the content slot can overflow.
 */

const props = defineProps<{ card: SimCard }>()

const emit = defineEmits<{
  click: []
}>()

const { pickSurfaceClass } = useBackgroundSurface()

const flagSrc = computed(() => props.card.region ? getFlagSrc(props.card.region) : '')
</script>

<template>
  <div
    class="sim-shell relative h-full cursor-pointer transition-transform duration-200 hover:z-1 hover:-translate-y-0.5 focus-visible:outline-none"
    :data-status="props.card.status"
    role="link"
    tabindex="0"
    :aria-label="`${props.card.carrier} ${props.card.numberMasked}`"
    @click="emit('click')"
    @keydown.enter="emit('click')"
  >
    <div class="sim-shell-glow absolute inset-0" aria-hidden="true">
      <div class="sim-shell-edge absolute inset-0" />
      <div class="sim-shell-face absolute inset-px overflow-hidden" :class="pickSurfaceClass('', 'backdrop-blur-sm')">
        <img v-if="flagSrc" :src="flagSrc" alt="" class="sim-flag-mark" loading="lazy">
      </div>
    </div>
    <div class="relative flex h-full flex-col">
      <slot />
    </div>
  </div>
</template>

<style>
/* Unscoped: Vue's scoped CSS compiler strips the selector when using :global(.dark) as a prefix, applying rules to <html>. Classes are prefixed with .sim- to avoid collisions. */
.sim-shell-glow {
  transition: filter 0.2s;
}

.sim-shell-edge {
  clip-path: polygon(17px 0, 100% 0, 100% 100%, 0 100%, 0 17px);
  border-radius: calc(var(--radius) - 2px);
  background-color: transparent;
  transition: background-color 0.2s;
}

/* Offset inner cut by 0.4px so the diagonal border matches the 1px straight edges */
.sim-shell-face {
  clip-path: polygon(16.4px 0, 100% 0, 100% 100%, 0 100%, 0 16.4px);
  border-radius: calc(var(--radius) - 3px);
  background-color: color-mix(in oklab, var(--background) 60%, transparent);
  transition: background-color 0.2s;
}

.sim-flag-mark {
  position: absolute;
  right: -24px;
  bottom: -34px;
  width: 150px;
  height: 150px;
  opacity: 0.13;
  transform: rotate(-12deg);
  pointer-events: none;
  transition:
    opacity 0.3s,
    transform 0.4s;
}

.sim-shell:hover .sim-shell-glow,
.sim-shell:focus-visible .sim-shell-glow {
  filter: drop-shadow(0 0 10px color-mix(in oklab, oklch(0.596 0.145 163.225) 22%, transparent));
}

.sim-shell:hover .sim-shell-edge,
.sim-shell:focus-visible .sim-shell-edge {
  background-color: color-mix(in oklab, oklch(0.596 0.145 163.225) 22%, transparent);
}

.sim-shell:hover .sim-shell-face {
  background-color: var(--background);
}

.sim-shell:hover .sim-flag-mark {
  opacity: 0.22;
  transform: rotate(-9deg) scale(1.03);
}

.sim-shell[data-status='expired'] .sim-shell-edge {
  background-color: color-mix(in oklab, oklch(0.577 0.245 27.325) 20%, transparent);
}

.sim-shell[data-status='cancelled'] .sim-shell-edge {
  background-color: color-mix(in oklab, oklch(0.554 0.046 257.417) 18%, transparent);
}

.sim-shell[data-status='cancelled']:hover .sim-shell-glow {
  filter: none;
}

.sim-shell[data-status='cancelled'] .sim-flag-mark {
  filter: grayscale(1);
}

/* Dark mode: slightly lifted card surface, subtle resting border to keep the notch visible, and faded flag watermark */
.dark .sim-shell-face {
  background-color: color-mix(in oklab, var(--card) 66%, transparent);
}

.dark .sim-shell-edge {
  background-color: rgb(255 255 255 / 7%);
}

.dark .sim-shell:hover .sim-shell-face {
  background-color: color-mix(in oklab, var(--card) 92%, transparent);
}

.dark .sim-shell:hover .sim-shell-edge,
.dark .sim-shell:focus-visible .sim-shell-edge {
  background-color: color-mix(in oklab, var(--success) 50%, transparent);
}

.dark .sim-shell[data-status='cancelled'] .sim-shell-edge {
  background-color: rgb(148 163 184 / 16%);
}

.dark .sim-flag-mark {
  opacity: 0.15;
  mask-image: linear-gradient(315deg, #000 22%, transparent 68%);
}

.dark .sim-shell:hover .sim-flag-mark {
  opacity: 0.22;
}

@media (prefers-reduced-motion: reduce) {
  .sim-shell,
  .sim-flag-mark {
    transition: none;
  }
}
</style>
