<script setup lang="ts">
import type { CardStyle } from '@/stores/app'

/** Miniature layout icon for the card style switcher */

const props = defineProps<{ cardStyle: CardStyle }>()
</script>

<template>
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <template v-if="props.cardStyle === 'namecard'">
      <rect x="2.5" y="1.5" width="11" height="13" rx="2" />
      <circle cx="8" cy="6.2" r="2.2" />
      <path d="M5.5 11h5" />
    </template>
    <template v-else-if="props.cardStyle === 'dial'">
      <rect x="1.5" y="2.5" width="13" height="11" rx="2" />
      <path d="M4 6.8h3.3M4 9.4h2.3" />
      <circle cx="10.7" cy="8" r="1.9" />
    </template>
    <template v-else>
      <rect x="1.5" y="2.5" width="13" height="11" rx="2" />
      <path d="M4 6.2h4.5" />
      <path d="M4 10h8" stroke-width="2" />
    </template>
  </svg>
</template>
