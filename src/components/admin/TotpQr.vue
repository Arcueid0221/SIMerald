<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { renderSVG } from 'uqr'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'

/** 两步验证二维码：手机验证器 App 扫码；扫不了时可以手动输入下面的密钥 */
const props = defineProps<{
  uri: string
  secret: string
}>()

const SECRET_GROUP_REGEX = /.{1,4}/g

const svg = computed(() => renderSVG(props.uri, { ecc: 'M', border: 2, pixelSize: 4 }))
const groupedSecret = computed(() => props.secret.match(SECRET_GROUP_REGEX)?.join(' ') ?? props.secret)

async function copySecret() {
  try {
    await navigator.clipboard.writeText(props.secret)
    window.$message.success('密钥已复制')
  }
  catch {
    window.$message.error('复制失败，请手动抄写')
  }
}
</script>

<template>
  <div class="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
    <!-- 二维码由本地生成，不经过任何第三方 -->
    <div class="size-44 shrink-0 rounded-md bg-white p-1 [&>svg]:size-full" v-html="svg" />
    <div class="flex flex-col gap-2 min-w-0 text-xs text-muted-foreground leading-relaxed">
      <p>用手机上的验证器 App（Google Authenticator、Microsoft Authenticator、1Password 等）扫描左边的二维码。</p>
      <p>扫不了的话，在 App 里选「手动输入密钥」，填下面这串：</p>
      <div class="flex items-center gap-2">
        <code class="rounded-sm bg-slate-500/10 px-2 py-1 font-mono text-foreground break-all">{{ groupedSecret }}</code>
        <Button variant="ghost" size="icon-xs" aria-label="复制密钥" @click="copySecret">
          <Icon icon="tabler:copy" />
        </Button>
      </div>
    </div>
  </div>
</template>
