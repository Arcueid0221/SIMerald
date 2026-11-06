<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'

/** One-time TOTP recovery codes, displayed only at generation time */
const props = defineProps<{
  codes: string[]
}>()
const { t } = useI18n()

async function copyAll() {
  try {
    await navigator.clipboard.writeText(props.codes.join('\n'))
    window.$message.success(t('recovery.copied'))
  }
  catch {
    window.$message.error(t('common.copyFailed'))
  }
}

function download() {
  const blob = new Blob([`${t('recovery.fileHeader')}\n\n${props.codes.join('\n')}\n`], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'simerald-recovery-codes.txt'
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="rounded-md bg-yellow-400/10 p-3 text-xs leading-relaxed text-yellow-700 dark:text-yellow-300">
      {{ t('recovery.notice') }}
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
      <code
        v-for="code in props.codes" :key="code"
        class="rounded-sm bg-slate-500/10 px-2 py-1.5 text-center font-mono text-sm"
      >{{ code }}</code>
    </div>
    <div class="flex gap-2">
      <Button variant="outline" size="sm" @click="copyAll">
        <Icon icon="tabler:copy" /> {{ t('recovery.copyAll') }}
      </Button>
      <Button variant="outline" size="sm" @click="download">
        <Icon icon="tabler:download" /> {{ t('recovery.download') }}
      </Button>
    </div>
  </div>
</template>
