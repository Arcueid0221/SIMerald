<script setup lang="ts">
const props = defineProps<{ label?: string, id?: string }>()
const model = defineModel<boolean>({ default: false })
</script>

<template>
  <button
    :id="props.id"
    type="button" role="switch" :aria-checked="model" :aria-label="props.label"
    class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    :class="model ? 'bg-emerald-600' : 'bg-muted-foreground/25'"
    @click="model = !model"
  >
    <span
      class="inline-block size-4 rounded-full bg-background shadow transition-transform"
      :class="model ? 'translate-x-4.5' : 'translate-x-0.5'"
    />
  </button>
</template>
