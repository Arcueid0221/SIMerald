<script setup lang="ts">
import type { AdminStatus } from '@shared/types'
import type { TotpEnrollment } from '@/utils/api'
import { ref } from 'vue'
import AdminSection from '@/components/admin/AdminSection.vue'
import FormField from '@/components/admin/FormField.vue'
import RecoveryCodes from '@/components/admin/RecoveryCodes.vue'
import TotpQr from '@/components/admin/TotpQr.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api, ApiError } from '@/utils/api'

const props = defineProps<{ status: AdminStatus }>()
const emit = defineEmits<{ changed: [] }>()

type Mode = 'idle' | 'password' | 'rebind' | 'recovery'
const mode = ref<Mode>('idle')
const busy = ref(false)
const error = ref('')

const currentPassword = ref('')
const code = ref('')
const newPassword = ref('')
const newPasswordConfirm = ref('')
const enrollment = ref<TotpEnrollment | null>(null)
const newCode = ref('')
const recoveryCodes = ref<string[]>([])

function reset(next: Mode = 'idle') {
  mode.value = next
  error.value = ''
  currentPassword.value = ''
  code.value = ''
  newPassword.value = ''
  newPasswordConfirm.value = ''
  enrollment.value = null
  newCode.value = ''
  recoveryCodes.value = []
}

async function run(action: () => Promise<void>) {
  error.value = ''
  busy.value = true
  try {
    await action()
  }
  catch (e) {
    error.value = e instanceof ApiError ? e.message : '操作失败'
  }
  finally {
    busy.value = false
  }
}

function changePassword() {
  if (newPassword.value.length < 10) {
    error.value = '新密码至少 10 位'
    return
  }
  if (newPassword.value !== newPasswordConfirm.value) {
    error.value = '两次输入的新密码不一样'
    return
  }
  run(async () => {
    await api.changePassword(currentPassword.value, code.value.trim(), newPassword.value)
    window.$message.success('密码已修改，其他设备已退出登录')
    reset()
    emit('changed')
  })
}

function beginRebind() {
  run(async () => {
    enrollment.value = await api.totpBegin(currentPassword.value, code.value.trim())
    currentPassword.value = ''
    code.value = ''
  })
}

function finishRebind() {
  if (!enrollment.value)
    return
  run(async () => {
    const result = await api.totpFinish(enrollment.value!.token, newCode.value.trim())
    enrollment.value = null
    recoveryCodes.value = result.recoveryCodes
    window.$message.success('两步验证已重新绑定，旧手机上的验证码已失效')
    emit('changed')
  })
}

function regenerate() {
  run(async () => {
    const result = await api.regenerateRecovery(currentPassword.value, code.value.trim())
    currentPassword.value = ''
    code.value = ''
    recoveryCodes.value = result.recoveryCodes
    emit('changed')
  })
}

function logoutOthers() {
  run(async () => {
    await api.logoutOthers()
    window.$message.success('其他设备已退出登录')
    emit('changed')
  })
}
</script>

<template>
  <AdminSection title="账号安全" icon="tabler:shield-lock">
    <div class="flex flex-col gap-4">
      <div class="grid grid-cols-2 gap-3">
        <div class="rounded-sm bg-slate-500/5 p-2 flex flex-col gap-1">
          <span class="text-xs text-muted-foreground">剩余恢复码</span>
          <span class="text-sm" :class="props.status.recoveryCodesLeft <= 3 && 'text-yellow-600 dark:text-yellow-400'">{{ props.status.recoveryCodesLeft }} 个</span>
        </div>
        <div class="rounded-sm bg-slate-500/5 p-2 flex flex-col gap-1">
          <span class="text-xs text-muted-foreground">已登录的设备</span>
          <span class="text-sm">{{ props.status.sessions }} 台</span>
        </div>
      </div>

      <div v-if="mode === 'idle'" class="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" @click="reset('password')">
          修改密码
        </Button>
        <Button variant="outline" size="sm" @click="reset('rebind')">
          重新绑定两步验证
        </Button>
        <Button variant="outline" size="sm" @click="reset('recovery')">
          重新生成恢复码
        </Button>
        <Button variant="outline" size="sm" :disabled="busy || props.status.sessions <= 1" @click="logoutOthers">
          退出其他设备
        </Button>
      </div>

      <!-- Newly generated recovery codes -->
      <div v-if="recoveryCodes.length" class="flex flex-col gap-3">
        <RecoveryCodes :codes="recoveryCodes" />
        <div>
          <Button size="sm" @click="reset()">
            我已保存，完成
          </Button>
        </div>
      </div>

      <!-- Rebind step 2: scan new QR code -->
      <form v-else-if="mode === 'rebind' && enrollment" class="flex flex-col gap-4" @submit.prevent="finishRebind">
        <TotpQr :uri="enrollment.uri" :secret="enrollment.secret" />
        <FormField label="新 App 上显示的 6 位数字" for-id="sec-new-code">
          <Input id="sec-new-code" v-model="newCode" inputmode="numeric" maxlength="6" autocomplete="one-time-code" class="font-mono tracking-widest max-w-40" />
        </FormField>
        <p v-if="error" class="text-xs text-destructive">
          {{ error }}
        </p>
        <div class="flex gap-2">
          <Button type="submit" size="sm" :disabled="busy || newCode.length !== 6">
            验证并替换
          </Button>
          <Button type="button" variant="ghost" size="sm" @click="reset()">
            取消
          </Button>
        </div>
      </form>

      <!-- Step 1: verify current password and 2FA code -->
      <form
        v-else-if="mode !== 'idle'" class="flex flex-col gap-4 max-w-md"
        @submit.prevent="mode === 'password' ? changePassword() : mode === 'rebind' ? beginRebind() : regenerate()"
      >
        <p class="text-xs text-muted-foreground">
          {{ mode === 'password' ? '修改密码后，其他设备会被退出登录。' : mode === 'rebind' ? '换手机或重装验证器 App 时使用。完成后旧的验证码和恢复码都会作废。' : '旧的恢复码会全部作废。' }}
        </p>
        <FormField label="当前密码" for-id="sec-password">
          <Input id="sec-password" v-model="currentPassword" type="password" autocomplete="current-password" />
        </FormField>
        <FormField label="验证码" for-id="sec-code" help="验证器 App 上的 6 位数字，或一个恢复码">
          <Input id="sec-code" v-model="code" autocomplete="one-time-code" class="font-mono tracking-widest" />
        </FormField>
        <template v-if="mode === 'password'">
          <FormField label="新密码" for-id="sec-new-password" help="至少 10 位">
            <Input id="sec-new-password" v-model="newPassword" type="password" autocomplete="new-password" />
          </FormField>
          <FormField label="再输一次新密码" for-id="sec-new-password2">
            <Input id="sec-new-password2" v-model="newPasswordConfirm" type="password" autocomplete="new-password" />
          </FormField>
        </template>
        <p v-if="error" class="text-xs text-destructive">
          {{ error }}
        </p>
        <div class="flex gap-2">
          <Button type="submit" size="sm" :disabled="busy || !currentPassword || !code">
            {{ mode === 'password' ? '修改密码' : mode === 'rebind' ? '下一步' : '生成新的恢复码' }}
          </Button>
          <Button type="button" variant="ghost" size="sm" @click="reset()">
            取消
          </Button>
        </div>
      </form>
    </div>
  </AdminSection>
</template>
