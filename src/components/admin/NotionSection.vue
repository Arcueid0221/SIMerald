<script setup lang="ts">
import type { AdminStatus } from '@shared/types'
import { ref, watch } from 'vue'
import AdminSection from '@/components/admin/AdminSection.vue'
import FormField from '@/components/admin/FormField.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api, ApiError } from '@/utils/api'
import { refreshData } from '@/utils/init'

const props = defineProps<{ status: AdminStatus }>()
const emit = defineEmits<{ update: [status: AdminStatus] }>()

const token = ref('')
const clearToken = ref(false)
const cardsDb = ref(props.status.notion.cardsDb)
const recordsDb = ref(props.status.notion.recordsDb)
const accountsDb = ref(props.status.notion.accountsDb)
const mapping = ref(props.status.notion.mapping)
const showMapping = ref(false)
const saving = ref(false)

watch(() => props.status, (next) => {
  cardsDb.value = next.notion.cardsDb
  recordsDb.value = next.notion.recordsDb
  accountsDb.value = next.notion.accountsDb
  mapping.value = next.notion.mapping
})

const textareaClass = 'w-full min-h-64 rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30'

async function save() {
  saving.value = true
  try {
    const next = await api.saveNotion({
      token: token.value.trim() || undefined,
      clearToken: clearToken.value,
      cardsDb: cardsDb.value,
      recordsDb: recordsDb.value,
      accountsDb: accountsDb.value,
      mapping: mapping.value,
    })
    token.value = ''
    clearToken.value = false
    emit('update', next)
    await refreshData()
    if (next.notion.tokenConfigured && next.sync.lastError)
      window.$message.error(`已保存，但同步失败：${next.sync.lastError}`)
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
        <p>1. 打开 notion.so/profile/integrations，新建一个 Internal integration，权限只勾「读取内容」，复制它的 token。</p>
        <p>2. 在 Notion 里打开放 SIM 卡数据库的页面，点右上角 ··· →「连接」，选中刚建的 integration。扣款账户数据库在别的页面下时，也要对它做一次「连接」。</p>
        <p>3. 把 token 填到下面，保存后会立即同步一次。</p>
      </div>
      <FormField
        label="Notion token" for-id="notion-token"
        :help="props.status.notion.tokenFromEnv ? 'token 来自服务器的环境变量，这里不能修改' : props.status.notion.tokenConfigured ? '已配置。留空表示不修改；填新的会覆盖旧的' : 'token 只保存在服务器上，不会再显示出来'"
      >
        <Input
          id="notion-token" v-model="token" type="password" autocomplete="off"
          :placeholder="props.status.notion.tokenConfigured ? '••••••••（已配置）' : 'ntn_...'"
          :disabled="props.status.notion.tokenFromEnv"
        />
      </FormField>
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
      <div>
        <button type="button" class="text-xs text-emerald-600 hover:underline underline-offset-4" @click="showMapping = !showMapping">
          {{ showMapping ? '收起' : '展开' }}字段映射（高级）
        </button>
      </div>
      <FormField v-if="showMapping" label="字段映射 JSON" for-id="notion-mapping" help="左边是 SIMerald 的字段，右边是你 Notion 数据库里的列名。你的数据库列名不一样时改右边即可。">
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
