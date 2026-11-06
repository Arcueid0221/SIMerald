<script setup lang="ts">
import type { AdminStatus, DetectMatch, MappingPresetChoice } from '@shared/types'
import { Icon } from '@iconify/vue'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminSection from '@/components/admin/AdminSection.vue'
import FormField from '@/components/admin/FormField.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { translateError } from '@/i18n'
import { api, ApiError } from '@/utils/api'
import { refreshData } from '@/utils/init'
import { notionSetupUrl } from '@/utils/links'

const props = defineProps<{ status: AdminStatus }>()
const emit = defineEmits<{ update: [status: AdminStatus] }>()
const { t } = useI18n()

const token = ref('')
const clearToken = ref(false)
const cardsDb = ref(props.status.notion.cardsDb)
const recordsDb = ref(props.status.notion.recordsDb)
const accountsDb = ref(props.status.notion.accountsDb)
const preset = ref<MappingPresetChoice>(props.status.notion.preset)
const mapping = ref(props.status.notion.mapping)
const saving = ref(false)
const detecting = ref(false)
const matches = ref<DetectMatch[]>([])

watch(() => props.status, (next) => {
  cardsDb.value = next.notion.cardsDb
  recordsDb.value = next.notion.recordsDb
  accountsDb.value = next.notion.accountsDb
  preset.value = next.notion.preset
  mapping.value = next.notion.mapping
})

const PRESET_CHOICES: MappingPresetChoice[] = ['zh', 'en', 'custom']
const presetOptions = computed(() => PRESET_CHOICES.map(value => ({ value, label: t(`notion.presets.${value}`) })))

const selectClass = 'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30 [&>option]:bg-background'
const textareaClass = 'w-full min-h-64 rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30'

function describeMatch(match: DetectMatch): string {
  const parts = [match.cards.title || t('notion.detect.cardsFallback'), match.records?.title || t('notion.detect.noRecords')]
  if (match.accounts)
    parts.push(match.accounts.title || t('notion.detect.accountsFallback'))
  return parts.join(' / ')
}

function applyMatch(match: DetectMatch) {
  preset.value = match.preset
  cardsDb.value = match.cards.id
  recordsDb.value = match.records?.id ?? ''
  accountsDb.value = match.accounts?.id ?? ''
  matches.value = []
  if (match.records)
    window.$message.success(t('notion.detect.found', { preset: t(`notion.presets.${match.preset}`), databases: describeMatch(match) }))
  else
    window.$message.warning(t('notion.detect.recordsMissing'))
}

async function detect() {
  detecting.value = true
  matches.value = []
  try {
    const result = await api.detectNotion(token.value.trim() || undefined)
    if (!result.matches.length)
      window.$message.error(t('notion.detect.none'))
    else if (result.matches.length === 1)
      applyMatch(result.matches[0]!)
    else
      matches.value = result.matches
  }
  catch (e) {
    window.$message.error(e instanceof ApiError ? e.message : t('notion.detect.failed'))
  }
  finally {
    detecting.value = false
  }
}

async function save() {
  saving.value = true
  try {
    const next = await api.saveNotion({
      token: token.value.trim() || undefined,
      clearToken: clearToken.value,
      cardsDb: cardsDb.value,
      recordsDb: recordsDb.value,
      accountsDb: accountsDb.value,
      preset: preset.value,
      mapping: mapping.value,
    })
    token.value = ''
    clearToken.value = false
    emit('update', next)
    await refreshData()
    if (next.notion.tokenConfigured && next.sync.lastError)
      window.$message.error(t('notion.save.syncFailed', { error: translateError(next.sync.lastErrorCode, next.sync.lastErrorParams, next.sync.lastError) }))
    else if (next.notion.tokenConfigured && next.sync.fieldIssues?.length)
      window.$message.warning(t('notion.save.fieldIssues', next.sync.fieldIssues.length))
    else
      window.$message.success(next.notion.tokenConfigured ? t('notion.save.synced') : t('notion.save.saved'))
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
  <AdminSection :title="t('notion.title')" icon="tabler:brand-notion" :description="t('notion.description')">
    <form class="flex flex-col gap-4" @submit.prevent="save">
      <div class="rounded-md bg-slate-500/5 p-3 text-xs text-muted-foreground leading-relaxed space-y-1">
        <i18n-t keypath="notion.steps.copy" tag="p">
          <template #guide>
            <a :href="notionSetupUrl()" target="_blank" rel="noopener noreferrer" class="text-emerald-600 hover:underline underline-offset-4">{{ t('notion.steps.guide') }}</a>
          </template>
        </i18n-t>
        <p>{{ t('notion.steps.integration') }}</p>
        <p>{{ t('notion.steps.connect') }}</p>
        <p>{{ t('notion.steps.detect') }}</p>
      </div>
      <FormField
        label="Notion token" for-id="notion-token"
        :help="props.status.notion.tokenFromEnv ? t('notion.token.fromEnv') : props.status.notion.tokenConfigured ? t('notion.token.configured') : t('notion.token.help')"
      >
        <div class="flex gap-2">
          <Input
            id="notion-token" v-model="token" type="password" autocomplete="off" class="flex-1"
            :placeholder="props.status.notion.tokenConfigured ? t('notion.token.configuredPlaceholder') : 'ntn_...'"
            :disabled="props.status.notion.tokenFromEnv"
          />
          <Button
            type="button" variant="outline"
            :disabled="detecting || (!token.trim() && !props.status.notion.tokenConfigured)"
            @click="detect"
          >
            <Icon icon="tabler:wand" :class="detecting && 'animate-pulse'" /> {{ detecting ? t('notion.detect.running') : t('notion.detect.button') }}
          </Button>
        </div>
      </FormField>
      <div v-if="matches.length" class="rounded-md border border-emerald-500/30 p-3 flex flex-col gap-2">
        <p class="text-xs text-muted-foreground">
          {{ t('notion.detect.choose', matches.length) }}
        </p>
        <button
          v-for="match in matches" :key="match.cards.id" type="button"
          class="text-left rounded-sm bg-slate-500/5 hover:bg-emerald-500/10 px-3 py-2 text-xs"
          @click="applyMatch(match)"
        >
          <span class="font-medium">{{ t(`notion.presets.${match.preset}`) }}</span>
          <span class="text-muted-foreground"> · {{ describeMatch(match) }}</span>
        </button>
      </div>
      <label v-if="props.status.notion.tokenConfigured && !props.status.notion.tokenFromEnv" class="flex items-center gap-2 text-xs text-muted-foreground">
        <input v-model="clearToken" type="checkbox" class="accent-emerald-600 size-4">
        {{ t('notion.token.clear') }}
      </label>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <FormField :label="t('notion.databases.cards')" for-id="notion-cards" :help="t('notion.databases.help')">
          <Input id="notion-cards" v-model="cardsDb" placeholder="https://www.notion.so/..." class="font-mono text-xs" />
        </FormField>
        <FormField :label="t('notion.databases.records')" for-id="notion-records" :help="t('notion.databases.help')">
          <Input id="notion-records" v-model="recordsDb" placeholder="https://www.notion.so/..." class="font-mono text-xs" />
        </FormField>
        <FormField :label="t('notion.databases.accounts')" for-id="notion-accounts" :help="t('notion.databases.accountsHelp')">
          <Input id="notion-accounts" v-model="accountsDb" :placeholder="t('notion.databases.optional')" class="font-mono text-xs" />
        </FormField>
      </div>
      <FormField :label="t('notion.preset')" for-id="notion-preset" :help="t('notion.presetHelp')">
        <select id="notion-preset" v-model="preset" :class="selectClass" class="md:max-w-xs">
          <option v-for="option in presetOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </FormField>
      <FormField v-if="preset === 'custom'" :label="t('notion.mapping')" for-id="notion-mapping" :help="t('notion.mappingHelp')">
        <textarea id="notion-mapping" v-model="mapping" spellcheck="false" :class="textareaClass" />
      </FormField>
      <div>
        <Button type="submit" :disabled="saving">
          {{ saving ? t('notion.save.running') : t('common.save') }}
        </Button>
      </div>
    </form>
  </AdminSection>
</template>
