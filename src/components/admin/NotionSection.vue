<script setup lang="ts">
import type { AdminStatus, DetectMatch, MappingPresetChoice } from '@shared/types'
import { Icon } from '@iconify/vue'
import { ref, watch } from 'vue'
import AdminSection from '@/components/admin/AdminSection.vue'
import FormField from '@/components/admin/FormField.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api, ApiError } from '@/utils/api'
import { refreshData } from '@/utils/init'
import { NOTION_SETUP_URL } from '@/utils/links'

const props = defineProps<{ status: AdminStatus }>()
const emit = defineEmits<{ update: [status: AdminStatus] }>()

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

const PRESET_OPTIONS: Array<{ value: MappingPresetChoice, label: string }> = [
  { value: 'zh', label: '中文模板' },
  { value: 'en', label: 'English template' },
  { value: 'custom', label: '自定义映射（JSON）' },
]

const PRESET_LABELS: Record<DetectMatch['preset'], string> = { zh: '中文模板', en: 'English template' }

const selectClass = 'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30 [&>option]:bg-background'
const textareaClass = 'w-full min-h-64 rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30'

function describeMatch(match: DetectMatch): string {
  const parts = [match.cards.title || 'SIM 卡', match.records?.title || '（没找到消费记录库）']
  if (match.accounts)
    parts.push(match.accounts.title || '支付账户')
  return parts.join(' / ')
}

function applyMatch(match: DetectMatch) {
  preset.value = match.preset
  cardsDb.value = match.cards.id
  recordsDb.value = match.records?.id ?? ''
  accountsDb.value = match.accounts?.id ?? ''
  matches.value = []
  if (match.records)
    window.$message.success(`已识别${PRESET_LABELS[match.preset]}：${describeMatch(match)}。点「保存」完成连接`)
  else
    window.$message.warning('找到了 SIM 卡库，但没找到关联的消费记录库，请确认它也「连接」给了这个 integration')
}

async function detect() {
  detecting.value = true
  matches.value = []
  try {
    const result = await api.detectNotion(token.value.trim() || undefined)
    if (!result.matches.length)
      window.$message.error('没找到 SIMerald 模板。请确认已复制模板，并在模板页面右上角 ··· →「连接」里选中了这个 integration')
    else if (result.matches.length === 1)
      applyMatch(result.matches[0]!)
    else
      matches.value = result.matches
  }
  catch (e) {
    window.$message.error(e instanceof ApiError ? e.message : '自动识别失败')
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
      window.$message.error(`已保存，但同步失败：${next.sync.lastError}`)
    else if (next.notion.tokenConfigured && next.sync.fieldIssues?.length)
      window.$message.warning(`已保存并完成同步，但有 ${next.sync.fieldIssues.length} 个字段对不上，详见「数据同步」`)
    else
      window.$message.success(next.notion.tokenConfigured ? '已保存并完成同步' : '已保存')
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
  <AdminSection title="Notion 连接" icon="tabler:brand-notion" description="SIMerald 只读取 Notion，不会修改里面的任何内容。">
    <form class="flex flex-col gap-4" @submit.prevent="save">
      <div class="rounded-md bg-slate-500/5 p-3 text-xs text-muted-foreground leading-relaxed space-y-1">
        <p>
          1. 把 SIMerald 的 Notion 模板复制到你的工作区（模板链接和详细步骤见<a :href="NOTION_SETUP_URL" target="_blank" rel="noopener noreferrer" class="text-emerald-600 hover:underline underline-offset-4">接入教程</a>）。
        </p>
        <p>2. 打开 notion.so/profile/integrations，新建一个 Internal integration，权限只勾「读取内容」，复制它的 token。</p>
        <p>3. 在 Notion 里打开模板页面，点右上角 ··· →「连接」，选中刚建的 integration。</p>
        <p>4. 把 token 填到下面，点「自动识别」，确认识别结果后点「保存」，会立即同步一次。</p>
      </div>
      <FormField
        label="Notion token" for-id="notion-token"
        :help="props.status.notion.tokenFromEnv ? 'token 来自服务器的环境变量，这里不能修改' : props.status.notion.tokenConfigured ? '已配置。留空表示不修改；填新的会覆盖旧的' : 'token 只保存在服务器上，不会再显示出来'"
      >
        <div class="flex gap-2">
          <Input
            id="notion-token" v-model="token" type="password" autocomplete="off" class="flex-1"
            :placeholder="props.status.notion.tokenConfigured ? '••••••••（已配置）' : 'ntn_...'"
            :disabled="props.status.notion.tokenFromEnv"
          />
          <Button
            type="button" variant="outline"
            :disabled="detecting || (!token.trim() && !props.status.notion.tokenConfigured)"
            @click="detect"
          >
            <Icon icon="tabler:wand" :class="detecting && 'animate-pulse'" /> {{ detecting ? '识别中…' : '自动识别' }}
          </Button>
        </div>
      </FormField>
      <div v-if="matches.length" class="rounded-md border border-emerald-500/30 p-3 flex flex-col gap-2">
        <p class="text-xs text-muted-foreground">
          找到 {{ matches.length }} 套模板，选择要连接的那一套：
        </p>
        <button
          v-for="match in matches" :key="match.cards.id" type="button"
          class="text-left rounded-sm bg-slate-500/5 hover:bg-emerald-500/10 px-3 py-2 text-xs"
          @click="applyMatch(match)"
        >
          <span class="font-medium">{{ PRESET_LABELS[match.preset] }}</span>
          <span class="text-muted-foreground"> · {{ describeMatch(match) }}</span>
        </button>
      </div>
      <label v-if="props.status.notion.tokenConfigured && !props.status.notion.tokenFromEnv" class="flex items-center gap-2 text-xs text-muted-foreground">
        <input v-model="clearToken" type="checkbox" class="accent-emerald-600 size-4">
        删除已保存的 token（删除后会显示演示数据）
      </label>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <FormField label="SIM 卡数据库" for-id="notion-cards" help="数据库链接或 ID">
          <Input id="notion-cards" v-model="cardsDb" placeholder="https://www.notion.so/..." class="font-mono text-xs" />
        </FormField>
        <FormField label="消费记录数据库" for-id="notion-records" help="数据库链接或 ID">
          <Input id="notion-records" v-model="recordsDb" placeholder="https://www.notion.so/..." class="font-mono text-xs" />
        </FormField>
        <FormField label="扣款账户数据库（可选）" for-id="notion-accounts" help="用来显示扣款账户名称">
          <Input id="notion-accounts" v-model="accountsDb" placeholder="可留空" class="font-mono text-xs" />
        </FormField>
      </div>
      <FormField label="字段预设" for-id="notion-preset" help="复制官方模板时选对应语言即可；数据库列名和模板不一样时选「自定义映射」。">
        <select id="notion-preset" v-model="preset" :class="selectClass" class="md:max-w-xs">
          <option v-for="option in PRESET_OPTIONS" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </FormField>
      <FormField v-if="preset === 'custom'" label="字段映射 JSON" for-id="notion-mapping" help="在中文模板的基础上覆盖：左边是 SIMerald 的字段，右边是你 Notion 数据库里的列名。只需要写和中文模板不一样的部分。">
        <textarea id="notion-mapping" v-model="mapping" spellcheck="false" :class="textareaClass" />
      </FormField>
      <div>
        <Button type="submit" :disabled="saving">
          {{ saving ? '正在保存并同步…' : '保存' }}
        </Button>
      </div>
    </form>
  </AdminSection>
</template>
