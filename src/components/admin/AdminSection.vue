<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { CardX } from '@/components/ui/card-x'
import { useBackgroundSurface } from '@/composables/useBackgroundSurface'

const props = defineProps<{
  title: string
  icon?: string
  description?: string
}>()

const { pickSurfaceClass } = useBackgroundSurface()
</script>

<template>
  <CardX
    size="small"
    class="border-none transition-all rounded-md"
    :class="pickSurfaceClass('bg-background/60', 'bg-background/50 backdrop-blur-xs')"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <Icon v-if="props.icon" :icon="props.icon" :width="18" :height="18" class="text-emerald-600" />
        <span class="text-base font-bold">{{ props.title }}</span>
      </div>
      <p v-if="props.description" class="mt-1 text-xs text-muted-foreground leading-relaxed">
        {{ props.description }}
      </p>
    </template>
    <template v-if="$slots['header-extra']" #header-extra>
      <slot name="header-extra" />
    </template>
    <slot />
  </CardX>
</template>
