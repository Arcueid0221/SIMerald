<script setup lang="ts">
import type { CardStatus } from '@shared/types'
import { computed } from 'vue'

/** 和 Emerald 一样的状态点：使用中绿色、已过期红色（都会呼吸），已注销灰色 */

const props = defineProps<{ status: CardStatus }>()

const colorClass = computed(() => props.status === 'active' ? 'bg-emerald-600' : props.status === 'expired' ? 'bg-red-600' : 'bg-slate-400')
</script>

<template>
  <div class="relative size-2 shrink-0 rounded-full" :class="colorClass">
    <div v-if="props.status !== 'cancelled'" class="absolute inset-0 animate-ping rounded-full opacity-50" :class="colorClass" />
  </div>
</template>
