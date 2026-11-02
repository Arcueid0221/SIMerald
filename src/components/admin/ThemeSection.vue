<script setup lang="ts">
import type { SettingItem, SettingValue } from '@shared/settings-schema'
import { getDefaultSettings, SETTINGS_SCHEMA } from '@shared/settings-schema'
import { computed, ref, watch } from 'vue'
import AdminSection from '@/components/admin/AdminSection.vue'
import FormField from '@/components/admin/FormField.vue'
import SwitchToggle from '@/components/admin/SwitchToggle.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/stores/app'
import { api, ApiError } from '@/utils/api'

/**
 * 主题设置表单：按 shared/settings-schema.ts 自动生成，
 * 和 Komari 后台渲染 komari-theme.json 设置项的方式一样。
 */
const appStore = useAppStore()

const form = ref<Record<string, SettingValue>>({ ...getDefaultSettings(), ...(appStore.publicSettings?.theme_settings ?? {}) })
const saving = ref(false)

watch(() => appStore.publicSettings?.theme_settings, (next) => {
  if (next)
    form.value = { ...getDefaultSettings(), ...next }
})

interface SettingGroup {
  title: string
  items: SettingItem[]
}

const groups = computed<SettingGroup[]>(() => {
  const result: SettingGroup[] = []
  for (const item of SETTINGS_SCHEMA) {
    if (item.type === 'title')
      result.push({ title: item.name, items: [] })
    else
      result.at(-1)?.items.push(item)
  }
  return result
})

function selectOptions(item: SettingItem): Array<{ value: string, label: string }> {
  const values = (item.options ?? '').split(',')
  const labels = (item.optionLabels ?? '').split(',')
  return values.map((value, index) => ({ value, label: labels[index] || value }))
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
    window.$message.success('主题设置已保存')
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
  <AdminSection title="主题设置" icon="tabler:palette" description="保存后访客刷新页面就能看到。">
    <form class="flex flex-col gap-6" @submit.prevent="save">
      <section v-for="group in groups" :key="group.title" class="flex flex-col gap-3">
        <h4 class="text-sm font-semibold">
          {{ group.title }}
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <template v-for="item in group.items" :key="item.key">
            <div v-if="item.type === 'switch'" class="flex items-start justify-between gap-3 rounded-sm bg-slate-500/5 p-2.5">
              <div class="min-w-0">
                <label :for="fieldId(item)" class="text-sm">{{ item.name }}</label>
                <p v-if="item.help" class="text-[11px] text-muted-foreground/80 leading-relaxed mt-0.5">
                  {{ item.help }}
                </p>
              </div>
              <SwitchToggle :id="fieldId(item)" v-model="(form[item.key!] as boolean)" :label="item.name" />
            </div>
            <FormField v-else :label="item.name" :help="item.help" :for-id="fieldId(item)" :class="item.type === 'richtext' && 'md:col-span-2'">
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
          保存主题设置
        </Button>
      </div>
    </form>
  </AdminSection>
</template>
