<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed, ref, watch } from 'vue'
import { cn } from '@/lib/utils'

/** Carrier logo with initials fallback when no image is set or loading fails */

const props = defineProps<{
  carrier: string
  src?: string | null
  size: number
  class?: HTMLAttributes['class']
}>()

const WORD_SEPARATOR_REGEX = /[\s·.\-_]+/
const ASCII_REGEX = /^[\x20-\x7E]+$/

const failed = ref(false)
watch(() => props.src, () => {
  failed.value = false
})

const initials = computed(() => {
  const words = props.carrier.trim().split(WORD_SEPARATOR_REGEX).filter(Boolean)
  if (words.length === 0)
    return '?'
  if (ASCII_REGEX.test(words[0]!))
    return words.slice(0, 2).map(word => word[0]!.toUpperCase()).join('')
  return Array.from(words[0]!)[0]!
})

const boxStyle = computed(() => ({ width: `${props.size}px`, height: `${props.size}px` }))
</script>

<template>
  <img
    v-if="props.src && !failed"
    :src="props.src"
    :alt="props.carrier"
    :style="boxStyle"
    loading="lazy"
    :class="cn('shrink-0 object-cover ring-1 ring-border dark:brightness-[.88] dark:saturate-[.95]', props.class)"
    @error="failed = true"
  >
  <div
    v-else
    :style="{ ...boxStyle, fontSize: `${Math.round(props.size * 0.36)}px` }"
    :class="cn('flex shrink-0 select-none items-center justify-center bg-muted font-semibold text-muted-foreground ring-1 ring-border', props.class)"
    :aria-label="props.carrier"
  >
    {{ initials }}
  </div>
</template>
