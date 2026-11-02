<script setup lang="ts">
import type { AdminStatus } from '@shared/types'
import { Icon } from '@iconify/vue'
import { computed, ref, watch } from 'vue'
import AdminSection from '@/components/admin/AdminSection.vue'
import FormField from '@/components/admin/FormField.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api, ApiError } from '@/utils/api'
import { formatDateTime } from '@/utils/helper'
import { refreshData } from '@/utils/init'

const props = defineProps<{ status: AdminStatus }>()
const emit = defineEmits<{ update: [status: AdminStatus] }>()

const syncTime = ref(props.status.syncTime)
const timezone = ref(props.status.timezone)
const syncing = ref(false)
const saving = ref(false)

watch(() => props.status, (next) => {
  syncTime.value = next.syncTime
  timezone.value = next.timezone
})

const state = computed(() => {
  const s = props.status.sync
  if (!props.status.notion.tokenConfigured)
    return { text: '未连接 Notion（正在显示演示数据）', class: 'text-muted-foreground', icon: 'tabler:plug-x' }
  if (s.running)
    return { text: '正在同步…', class: 'text-sky-600', icon: 'tabler:refresh' }
  if (s.lastError)
    return { text: '上次同步失败', class: 'text-destructive', icon: 'tabler:alert-circle' }
  if (s.lastSuccessAt)
    return { text: '同步正常', class: 'text-emerald-600', icon: 'tabler:circle-check' }
  return { text: '还没有同步过', class: 'text-muted-foreground', icon: 'tabler:clock' }
})

function fmt(value: string | null): string {
  return value ? formatDateTime(value, 'YYYY-MM-DD HH:mm:ss') : '-'
}

async function syncNow() {
  syncing.value = true
  try {
    const next = await api.syncNow()
    emit('update', next)
    await refreshData()
    if (next.sync.lastError)
      window.$message.error(`同步失败：${next.sync.lastError}`)
    else
      window.$message.success(`同步完成：${next.sync.cardCount} 张卡，${next.sync.recordCount} 条消费记录`)
  }
  catch (e) {
    window.$message.error(e instanceof ApiError ? e.message : '同步失败')
  }
  finally {
    syncing.value = false
  }
}

async function saveSchedule() {
  saving.value = true
  try {
    emit('update', await api.saveSchedule(syncTime.value, timezone.value.trim()))
    window.$message.success('同步时间已保存')
  }
  catch (e) {
    window.$message.error(e instanceof ApiError ? e.message : '保存失败')
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <AdminSection title="数据同步" icon="tabler:refresh" description="SIMerald 每天从 Notion 拉取一次数据。在 Notion 里改完想马上看到，点「立即同步」。">
    <template #header-extra>
      <Button size="sm" :disabled="syncing || !props.status.notion.tokenConfigured" @click="syncNow">
        <Icon icon="tabler:refresh" :class="syncing && 'animate-spin'" /> 立即同步
      </Button>
    </template>
    <div class="flex flex-col gap-4">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="col-span-2 rounded-sm bg-slate-500/5 p-2 flex flex-col gap-1">
          <span class="text-xs text-muted-foreground">状态</span>
          <span class="text-sm flex items-center gap-1" :class="state.class">
            <Icon :icon="state.icon" :width="14" :height="14" :class="props.status.sync.running && 'animate-spin'" />
            {{ state.text }}
          </span>
        </div>
        <div class="rounded-sm bg-slate-500/5 p-2 flex flex-col gap-1">
          <span class="text-xs text-muted-foreground">卡片</span>
          <span class="text-sm">{{ props.status.sync.cardCount }} 张</span>
        </div>
        <div class="rounded-sm bg-slate-500/5 p-2 flex flex-col gap-1">
          <span class="text-xs text-muted-foreground">消费记录</span>
          <span class="text-sm">{{ props.status.sync.recordCount }} 条</span>
        </div>
        <div class="col-span-2 rounded-sm bg-slate-500/5 p-2 flex flex-col gap-1">
          <span class="text-xs text-muted-foreground">上次成功</span>
          <span class="text-sm">{{ fmt(props.status.sync.lastSuccessAt) }}</span>
        </div>
        <div class="col-span-2 rounded-sm bg-slate-500/5 p-2 flex flex-col gap-1">
          <span class="text-xs text-muted-foreground">下次自动同步</span>
          <span class="text-sm">{{ fmt(props.status.sync.nextRunAt) }}</span>
        </div>
      </div>
      <div v-if="!props.status.sync.lastError && props.status.sync.lastWarning" class="rounded-md bg-yellow-400/10 p-3 text-xs leading-relaxed text-yellow-700 dark:text-yellow-300">
        {{ props.status.sync.lastWarning }}
      </div>
      <div v-if="props.status.sync.lastError" class="rounded-md bg-red-400/10 p-3 text-xs text-destructive leading-relaxed">
        {{ fmt(props.status.sync.lastFinishedAt) }}：{{ props.status.sync.lastError }}
      </div>
      <form class="flex flex-wrap items-end gap-3" @submit.prevent="saveSchedule">
        <FormField label="每天同步时间" for-id="sync-time">
          <Input id="sync-time" v-model="syncTime" type="time" class="w-32" />
        </FormField>
        <FormField label="时区" for-id="sync-tz">
          <Input id="sync-tz" v-model="timezone" placeholder="Asia/Shanghai" class="w-48" />
        </FormField>
        <Button type="submit" variant="outline" :disabled="saving">
          保存时间
        </Button>
      </form>
    </div>
  </AdminSection>
</template>
