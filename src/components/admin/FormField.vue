<script setup lang="ts">
const props = defineProps<{
  label: string
  help?: string
  forId?: string
}>()
</script>

<template>
  <div class="flex flex-col gap-1.5 min-w-0">
    <label :for="props.forId" class="text-xs font-medium text-muted-foreground">{{ props.label }}</label>
    <slot />
    <p v-if="props.help" class="text-[11px] text-muted-foreground/80 leading-relaxed">
      {{ props.help }}
    </p>
  </div>
</template>
