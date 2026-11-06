<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { renderSVG } from 'uqr'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  uri: string
  secret: string
}>()
const { t } = useI18n()

const SECRET_GROUP_REGEX = /.{1,4}/g

const svg = computed(() => renderSVG(props.uri, { ecc: 'M', border: 2, pixelSize: 4 }))
const groupedSecret = computed(() => props.secret.match(SECRET_GROUP_REGEX)?.join(' ') ?? props.secret)

async function copySecret() {
  try {
    await navigator.clipboard.writeText(props.secret)
    window.$message.success(t('totp.secretCopied'))
  }
  catch {
    window.$message.error(t('common.copyFailed'))
  }
}
</script>

<template>
  <div class="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
    <!-- QR SVG is rendered locally via uqr without external requests -->
    <div class="size-44 shrink-0 rounded-md bg-white p-1 [&>svg]:size-full" v-html="svg" />
    <div class="flex flex-col gap-2 min-w-0 text-xs text-muted-foreground leading-relaxed">
      <p>{{ t('totp.scan') }}</p>
      <p>{{ t('totp.manual') }}</p>
      <div class="flex items-center gap-2">
        <code class="rounded-sm bg-slate-500/10 px-2 py-1 font-mono text-foreground break-all">{{ groupedSecret }}</code>
        <Button variant="ghost" size="icon-xs" :aria-label="t('totp.copySecret')" @click="copySecret">
          <Icon icon="tabler:copy" />
        </Button>
      </div>
    </div>
  </div>
</template>
