<script setup lang="ts">
import type { SimCard } from '@shared/types'
import { computed } from 'vue'
import { useBackgroundSurface } from '@/composables/useBackgroundSurface'
import { getFlagSrc } from '@/utils/regionHelper'

/**
 * 四种卡片样式共用的外壳：左上角切掉一个角（SIM 卡的缺角），右下角是斜放的国旗水印。
 * 切角只裁背景层，内容层不裁，这样悬停提示可以伸出卡片。
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
/* 不用 scoped：scoped 里写 :global(.dark) 前缀时，Vue 会把整条选择器换成 .dark，规则就落到了 <html> 上。这里的类名都带前缀，不会和别处冲突 */
.sim-shell-glow {
  transition: filter 0.2s;
}

.sim-shell-edge {
  clip-path: polygon(17px 0, 100% 0, 100% 100%, 0 100%, 0 17px);
  border-radius: calc(var(--radius) - 2px);
  background-color: transparent;
  transition: background-color 0.2s;
}

/* 内层切角多 0.4px，让斜边的描边和直边一样粗 */
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

/* 深色模式：卡面比页面亮一档、平时就有极细的描边（看得见切角），悬停变亮；国旗往卡片中间渐隐，不压字 */
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
