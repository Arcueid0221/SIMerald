<script setup lang="ts">
import type { TotpEnrollment } from '@/utils/api'
import { ref } from 'vue'
import AdminSection from '@/components/admin/AdminSection.vue'
import FormField from '@/components/admin/FormField.vue'
import RecoveryCodes from '@/components/admin/RecoveryCodes.vue'
import TotpQr from '@/components/admin/TotpQr.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api, ApiError } from '@/utils/api'

const emit = defineEmits<{ done: [] }>()

const step = ref<1 | 2 | 3>(1)
const setupKey = ref('')
const password = ref('')
const passwordConfirm = ref('')
const code = ref('')
const enrollment = ref<TotpEnrollment | null>(null)
const recoveryCodes = ref<string[]>([])
const saved = ref(false)
const busy = ref(false)
const error = ref('')

async function begin() {
  error.value = ''
  if (password.value.length < 10) {
    error.value = '密码至少 10 位'
    return
  }
  if (password.value !== passwordConfirm.value) {
    error.value = '两次输入的密码不一样'
    return
  }
  busy.value = true
  try {
    enrollment.value = await api.setupBegin(setupKey.value.trim(), password.value)
    step.value = 2
  }
  catch (e) {
    error.value = e instanceof ApiError ? e.message : '设置失败'
  }
  finally {
    busy.value = false
  }
}

async function finish() {
  error.value = ''
  if (!enrollment.value)
    return
  busy.value = true
  try {
    const result = await api.setupFinish(enrollment.value.token, code.value.trim())
    recoveryCodes.value = result.recoveryCodes
    password.value = ''
    passwordConfirm.value = ''
    step.value = 3
  }
  catch (e) {
    error.value = e instanceof ApiError ? e.message : '验证失败'
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto w-full flex flex-col gap-4">
    <AdminSection
      v-if="step === 1" title="首次设置 · 第 1 步：设置密码" icon="tabler:key"
      description="SIMerald 还没有站长账号。为了防止别人抢先设置，需要输入服务器上生成的一次性设置密钥：在服务器上运行 docker logs simerald 能看到，也保存在数据目录的 setup-key.txt 里。"
    >
      <form class="flex flex-col gap-4" @submit.prevent="begin">
        <FormField label="设置密钥" for-id="setup-key" help="格式类似 ABCD-EFGH-IJKL">
          <Input id="setup-key" v-model="setupKey" autocomplete="off" placeholder="XXXX-XXXX-XXXX" class="font-mono uppercase" />
        </FormField>
        <FormField label="站长密码" for-id="setup-password" help="至少 10 位，建议用密码管理器生成">
          <Input id="setup-password" v-model="password" type="password" autocomplete="new-password" />
        </FormField>
        <FormField label="再输一次密码" for-id="setup-password2">
          <Input id="setup-password2" v-model="passwordConfirm" type="password" autocomplete="new-password" />
        </FormField>
        <p v-if="error" class="text-xs text-destructive">
          {{ error }}
        </p>
        <div>
          <Button type="submit" :disabled="busy || !setupKey || !password">
            下一步
          </Button>
        </div>
      </form>
    </AdminSection>

    <AdminSection
      v-else-if="step === 2 && enrollment" title="首次设置 · 第 2 步：绑定两步验证" icon="tabler:shield-lock"
      description="以后登录除了密码，还要输入手机验证器 App 上的 6 位数字，这个数字每 30 秒变一次。"
    >
      <form class="flex flex-col gap-4" @submit.prevent="finish">
        <TotpQr :uri="enrollment.uri" :secret="enrollment.secret" />
        <FormField label="App 上显示的 6 位数字" for-id="setup-code">
          <Input id="setup-code" v-model="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="123456" class="font-mono tracking-widest max-w-40" />
        </FormField>
        <p v-if="error" class="text-xs text-destructive">
          {{ error }}
        </p>
        <div>
          <Button type="submit" :disabled="busy || code.length !== 6">
            验证并完成
          </Button>
        </div>
      </form>
    </AdminSection>

    <AdminSection v-else title="首次设置 · 第 3 步：保存恢复码" icon="tabler:lifebuoy">
      <div class="flex flex-col gap-4">
        <RecoveryCodes :codes="recoveryCodes" />
        <label class="flex items-center gap-2 text-sm">
          <input v-model="saved" type="checkbox" class="accent-emerald-600 size-4">
          我已经把恢复码保存好了
        </label>
        <div>
          <Button :disabled="!saved" @click="emit('done')">
            进入后台
          </Button>
        </div>
      </div>
    </AdminSection>
  </div>
</template>
