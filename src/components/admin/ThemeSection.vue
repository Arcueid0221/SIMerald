<script setup lang="ts">
import type { SettingItem, SettingValue } from '@shared/settings-schema'
import { getDefaultSettings, SETTINGS_SCHEMA } from '@shared/settings-schema'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminSection from '@/components/admin/AdminSection.vue'
import FormField from '@/components/admin/FormField.vue'
import SwitchToggle from '@/components/admin/SwitchToggle.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { translateKey } from '@/i18n'
import { useAppStore } from '@/stores/app'
import { api, ApiError } from '@/utils/api'

/**
 * Theme settings form generated from shared/settings-schema.ts,
 * matching how Komari renders komari-theme.json fields.
 */
const appStore = useAppStore()
const { t } = useI18n()

const form = ref<Record<string, SettingValue>>({ ...getDefaultSettings(), ...(appStore.publicSettings?.theme_settings ?? {}) })
const saving = ref(false)

watch(() => appStore.publicSettings?.theme_settings, (next) => {
  if (next)
    form.value = { ...getDefaultSettings(), ...next }
})

interface SettingGroup {
  section: string
  items: SettingItem[]
}

const groups = computed<SettingGroup[]>(() => {
  const result: SettingGroup[] = []
  for (const item of SETTINGS_SCHEMA) {
    if (item.type === 'title')
      result.push({ section: item.section ?? '', items: [] })
    else
      result.at(-1)?.items.push(item)
  }
  return result
})

// Labels live in the locale dictionaries under settings.sections / settings.fields (see shared/settings-schema.ts)
function sectionTitle(section: string): string {
  return translateKey(`settings.sections.${section}`, {}, section)
}

function fieldName(item: SettingItem): string {
  return translateKey(`settings.fields.${item.key}.name`, {}, item.key ?? '')
}

function fieldHelp(item: SettingItem): string | undefined {
  return translateKey(`settings.fields.${item.key}.help`, {}, '') || undefined
}

function selectOptions(item: SettingItem): Array<{ value: string, label: string }> {
  return (item.options ?? '').split(',').map(value => ({
    value,
    label: translateKey(`settings.fields.${item.key}.options.${value}`, {}, value),
  }))
}

function fieldId(item: SettingItem): string {
  return `theme-${item.key}`
}

const selectClass = 'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30 [&>option]:bg-background'
const textareaClass = 'w-full min-h-28 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30'

async function save() {
  saving.value = true
  try {
    const result = await api.saveTheme(form.value)
    if (appStore.publicSettings) {
      appStore.publicSettings = {
        ...appStore.publicSettings,
        sitename: String(result.theme_settings.sitename || 'SIMerald'),
        theme_settings: result.theme_settings,
      }
    }
    window.$message.success(t('theme.saved'))
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
  <AdminSection :title="t('theme.title')" icon="tabler:palette" :description="t('theme.description')">
    <form class="flex flex-col gap-6" @submit.prevent="save">
      <section v-for="group in groups" :key="group.section" class="flex flex-col gap-3">
        <h4 class="text-sm font-semibold">
          {{ sectionTitle(group.section) }}
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <template v-for="item in group.items" :key="item.key">
            <div v-if="item.type === 'switch'" class="flex items-start justify-between gap-3 rounded-sm bg-slate-500/5 p-2.5">
              <div class="min-w-0">
                <label :for="fieldId(item)" class="text-sm">{{ fieldName(item) }}</label>
                <p v-if="fieldHelp(item)" class="text-[11px] text-muted-foreground/80 leading-relaxed mt-0.5">
                  {{ fieldHelp(item) }}
                </p>
              </div>
              <SwitchToggle :id="fieldId(item)" v-model="(form[item.key!] as boolean)" :label="fieldName(item)" />
            </div>
            <FormField v-else :label="fieldName(item)" :help="fieldHelp(item)" :for-id="fieldId(item)" :class="item.type === 'richtext' && 'md:col-span-2'">
              <select v-if="item.type === 'select'" :id="fieldId(item)" v-model="form[item.key!]" :class="selectClass">
                <option v-for="option in selectOptions(item)" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
              <textarea v-else-if="item.type === 'richtext'" :id="fieldId(item)" v-model="(form[item.key!] as string)" :class="textareaClass" />
              <Input
                v-else-if="item.type === 'number'" :id="fieldId(item)" v-model.number="(form[item.key!] as number)"
                type="number" :min="item.min" :max="item.max"
              />
              <Input v-else :id="fieldId(item)" v-model="(form[item.key!] as string)" />
            </FormField>
          </template>
        </div>
      </section>
      <div>
        <Button type="submit" :disabled="saving">
          {{ t('theme.save') }}
        </Button>
      </div>
    </form>
  </AdminSection>
</template>
