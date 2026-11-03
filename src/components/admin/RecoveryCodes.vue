<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'

/** One-time TOTP recovery codes, displayed only at generation time */
const props = defineProps<{
  codes: string[]
}>()

async function copyAll() {
  try {
    await navigator.clipboard.writeText(props.codes.join('\n'))
    window.$message.success('恢复码已复制')
  }
  catch {
    window.$message.error('复制失败，请手动抄写')
  }
}

function download() {
  const blob = new Blob([`SIMerald 恢复码（每个只能用一次）\n\n${props.codes.join('\n')}\n`], { type: 'text/plain;charset=utf-8' })
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
      这些恢复码只显示这一次。手机丢了、验证器 App 打不开时，可以用其中一个代替 6 位验证码登录，每个只能用一次。请保存到密码管理器或打印出来。
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
      <code
        v-for="code in props.codes" :key="code"
        class="rounded-sm bg-slate-500/10 px-2 py-1.5 text-center font-mono text-sm"
      >{{ code }}</code>
    </div>
    <div class="flex gap-2">
      <Button variant="outline" size="sm" @click="copyAll">
        <Icon icon="tabler:copy" /> 复制全部
      </Button>
      <Button variant="outline" size="sm" @click="download">
        <Icon icon="tabler:download" /> 下载为文本文件
      </Button>
    </div>
  </div>
</template>
