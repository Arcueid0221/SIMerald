<script setup lang="ts">
import type { AdminStatus, FieldIssue } from '@shared/types'
import { Icon } from '@iconify/vue'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminSection from '@/components/admin/AdminSection.vue'
import FormField from '@/components/admin/FormField.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { translateError } from '@/i18n'
import { api, ApiError } from '@/utils/api'
import { formatDateTime } from '@/utils/helper'
import { refreshData } from '@/utils/init'

const props = defineProps<{ status: AdminStatus }>()
const emit = defineEmits<{ update: [status: AdminStatus] }>()
const { t } = useI18n()

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
    return { text: t('sync.state.notConnected'), class: 'text-muted-foreground', icon: 'tabler:plug-x' }
  if (s.running)
    return { text: t('sync.state.running'), class: 'text-sky-600', icon: 'tabler:refresh' }
  if (s.lastError)
    return { text: t('sync.state.failed'), class: 'text-destructive', icon: 'tabler:alert-circle' }
  if (s.lastSuccessAt)
    return { text: t('sync.state.ok'), class: 'text-emerald-600', icon: 'tabler:circle-check' }
  return { text: t('sync.state.never'), class: 'text-muted-foreground', icon: 'tabler:clock' }
})

const lastError = computed(() => {
  const s = props.status.sync
  return s.lastError ? translateError(s.lastErrorCode, s.lastErrorParams, s.lastError) : ''
})

const lastWarning = computed(() => {
  const s = props.status.sync
  return s.lastWarning ? translateError(s.lastWarningCode, s.lastWarningParams, s.lastWarning) : ''
})

const fieldIssues = computed(() => props.status.notion.tokenConfigured ? props.status.sync.fieldIssues ?? [] : [])

function describeIssue(issue: FieldIssue): string {
  if (issue.problem === 'missing')
    return t('sync.issues.missing')
  return t('sync.issues.type', { actual: issue.actualType ?? '?', expected: issue.expectedTypes.join(' / ') })
}

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
      window.$message.error(t('sync.failedWith', { error: translateError(next.sync.lastErrorCode, next.sync.lastErrorParams, next.sync.lastError) }))
    else
      window.$message.success(t('sync.done', { cards: t('sync.cardCount', next.sync.cardCount), records: t('sync.recordCount', next.sync.recordCount) }))
  }
  catch (e) {
    window.$message.error(e instanceof ApiError ? e.message : t('sync.failed'))
  }
  finally {
    syncing.value = false
  }
}

async function saveSchedule() {
  saving.value = true
  try {
    emit('update', await api.saveSchedule(syncTime.value, timezone.value.trim()))
    window.$message.success(t('sync.scheduleSaved'))
  }
  catch (e) {
    window.$message.error(e instanceof ApiError ? e.message : t('common.saveFailed'))
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <AdminSection :title="t('sync.title')" icon="tabler:refresh" :description="t('sync.description')">
    <template #header-extra>
      <Button size="sm" :disabled="syncing || !props.status.notion.tokenConfigured" @click="syncNow">
        <Icon icon="tabler:refresh" :class="syncing && 'animate-spin'" /> {{ t('sync.syncNow') }}
      </Button>
    </template>
    <div class="flex flex-col gap-4">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="col-span-2 rounded-sm bg-slate-500/5 p-2 flex flex-col gap-1">
          <span class="text-xs text-muted-foreground">{{ t('sync.status') }}</span>
          <span class="text-sm flex items-center gap-1" :class="state.class">
            <Icon :icon="state.icon" :width="14" :height="14" :class="props.status.sync.running && 'animate-spin'" />
            {{ state.text }}
          </span>
        </div>
        <div class="rounded-sm bg-slate-500/5 p-2 flex flex-col gap-1">
          <span class="text-xs text-muted-foreground">{{ t('sync.cards') }}</span>
          <span class="text-sm">{{ t('sync.cardCount', props.status.sync.cardCount) }}</span>
        </div>
        <div class="rounded-sm bg-slate-500/5 p-2 flex flex-col gap-1">
          <span class="text-xs text-muted-foreground">{{ t('sync.records') }}</span>
          <span class="text-sm">{{ t('sync.recordCount', props.status.sync.recordCount) }}</span>
        </div>
        <div class="col-span-2 rounded-sm bg-slate-500/5 p-2 flex flex-col gap-1">
          <span class="text-xs text-muted-foreground">{{ t('sync.lastSuccess') }}</span>
          <span class="text-sm">{{ fmt(props.status.sync.lastSuccessAt) }}</span>
        </div>
        <div class="col-span-2 rounded-sm bg-slate-500/5 p-2 flex flex-col gap-1">
          <span class="text-xs text-muted-foreground">{{ t('sync.nextRun') }}</span>
          <span class="text-sm">{{ fmt(props.status.sync.nextRunAt) }}</span>
        </div>
      </div>
      <div v-if="!lastError && lastWarning" class="rounded-md bg-yellow-400/10 p-3 text-xs leading-relaxed text-yellow-700 dark:text-yellow-300">
        {{ lastWarning }}
      </div>
      <div v-if="lastError" class="rounded-md bg-red-400/10 p-3 text-xs text-destructive leading-relaxed">
        {{ t('sync.errorAt', { time: fmt(props.status.sync.lastFinishedAt), error: lastError }) }}
      </div>
      <div v-if="fieldIssues.length" class="rounded-md bg-yellow-400/10 p-3 text-xs leading-relaxed text-yellow-700 dark:text-yellow-300 flex flex-col gap-1.5">
        <p class="font-medium">
          {{ t('sync.issues.title', fieldIssues.length) }}
        </p>
        <ul class="flex flex-col gap-1">
          <li v-for="issue in fieldIssues" :key="`${issue.db}.${issue.key}`" class="flex flex-wrap gap-x-1.5">
            <span :class="issue.important ? 'text-destructive' : ''">{{ issue.important ? '●' : '○' }}</span>
            <span>{{ t(`sync.issues.db.${issue.db}`) }}</span>
            <code class="font-mono">{{ issue.column || issue.key }}</code>
            <span>{{ describeIssue(issue) }}</span>
          </li>
        </ul>
        <p class="text-muted-foreground">
          {{ t('sync.issues.legend') }}
        </p>
      </div>
      <form class="flex flex-wrap items-end gap-3" @submit.prevent="saveSchedule">
        <FormField :label="t('sync.dailyTime')" for-id="sync-time">
          <Input id="sync-time" v-model="syncTime" type="time" class="w-32" />
        </FormField>
        <FormField :label="t('sync.timezone')" for-id="sync-tz">
          <Input id="sync-tz" v-model="timezone" placeholder="Asia/Shanghai" class="w-48" />
        </FormField>
        <Button type="submit" variant="outline" :disabled="saving">
          {{ t('sync.saveSchedule') }}
        </Button>
      </form>
    </div>
  </AdminSection>
</template>
