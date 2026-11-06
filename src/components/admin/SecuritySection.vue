<script setup lang="ts">
import type { AdminStatus } from '@shared/types'
import type { TotpEnrollment } from '@/utils/api'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminSection from '@/components/admin/AdminSection.vue'
import FormField from '@/components/admin/FormField.vue'
import RecoveryCodes from '@/components/admin/RecoveryCodes.vue'
import TotpQr from '@/components/admin/TotpQr.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api, ApiError } from '@/utils/api'

const props = defineProps<{ status: AdminStatus }>()
const emit = defineEmits<{ changed: [] }>()
const { t } = useI18n()

/** Mirrors MIN_PASSWORD_LENGTH in server/auth.ts */
const MIN_PASSWORD_LENGTH = 10

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
    error.value = e instanceof ApiError ? e.message : t('security.failed')
  }
  finally {
    busy.value = false
  }
}

function changePassword() {
  if (newPassword.value.length < MIN_PASSWORD_LENGTH) {
    error.value = t('errors.auth.passwordTooShort', { min: MIN_PASSWORD_LENGTH })
    return
  }
  if (newPassword.value !== newPasswordConfirm.value) {
    error.value = t('security.passwordMismatch')
    return
  }
  run(async () => {
    await api.changePassword(currentPassword.value, code.value.trim(), newPassword.value)
    window.$message.success(t('security.passwordChanged'))
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
    window.$message.success(t('security.rebound'))
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
    window.$message.success(t('security.othersLoggedOut'))
    emit('changed')
  })
}
</script>

<template>
  <AdminSection :title="t('security.title')" icon="tabler:shield-lock">
    <div class="flex flex-col gap-4">
      <div class="grid grid-cols-2 gap-3">
        <div class="rounded-sm bg-slate-500/5 p-2 flex flex-col gap-1">
          <span class="text-xs text-muted-foreground">{{ t('security.recoveryLeft') }}</span>
          <span class="text-sm" :class="props.status.recoveryCodesLeft <= 3 && 'text-yellow-600 dark:text-yellow-400'">{{ t('security.recoveryCount', props.status.recoveryCodesLeft) }}</span>
        </div>
        <div class="rounded-sm bg-slate-500/5 p-2 flex flex-col gap-1">
          <span class="text-xs text-muted-foreground">{{ t('security.sessions') }}</span>
          <span class="text-sm">{{ t('security.sessionCount', props.status.sessions) }}</span>
        </div>
      </div>

      <div v-if="mode === 'idle'" class="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" @click="reset('password')">
          {{ t('security.changePassword') }}
        </Button>
        <Button variant="outline" size="sm" @click="reset('rebind')">
          {{ t('security.rebind') }}
        </Button>
        <Button variant="outline" size="sm" @click="reset('recovery')">
          {{ t('security.regenerate') }}
        </Button>
        <Button variant="outline" size="sm" :disabled="busy || props.status.sessions <= 1" @click="logoutOthers">
          {{ t('security.logoutOthers') }}
        </Button>
      </div>

      <!-- Newly generated recovery codes -->
      <div v-if="recoveryCodes.length" class="flex flex-col gap-3">
        <RecoveryCodes :codes="recoveryCodes" />
        <div>
          <Button size="sm" @click="reset()">
            {{ t('security.savedDone') }}
          </Button>
        </div>
      </div>

      <!-- Rebind step 2: scan new QR code -->
      <form v-else-if="mode === 'rebind' && enrollment" class="flex flex-col gap-4" @submit.prevent="finishRebind">
        <TotpQr :uri="enrollment.uri" :secret="enrollment.secret" />
        <FormField :label="t('security.newCode')" for-id="sec-new-code">
          <Input id="sec-new-code" v-model="newCode" inputmode="numeric" maxlength="6" autocomplete="one-time-code" class="font-mono tracking-widest max-w-40" />
        </FormField>
        <p v-if="error" class="text-xs text-destructive">
          {{ error }}
        </p>
        <div class="flex gap-2">
          <Button type="submit" size="sm" :disabled="busy || newCode.length !== 6">
            {{ t('security.verifyReplace') }}
          </Button>
          <Button type="button" variant="ghost" size="sm" @click="reset()">
            {{ t('common.cancel') }}
          </Button>
        </div>
      </form>

      <!-- Step 1: verify current password and 2FA code -->
      <form
        v-else-if="mode !== 'idle'" class="flex flex-col gap-4 max-w-md"
        @submit.prevent="mode === 'password' ? changePassword() : mode === 'rebind' ? beginRebind() : regenerate()"
      >
        <p class="text-xs text-muted-foreground">
          {{ t(`security.hints.${mode}`) }}
        </p>
        <FormField :label="t('security.currentPassword')" for-id="sec-password">
          <Input id="sec-password" v-model="currentPassword" type="password" autocomplete="current-password" />
        </FormField>
        <FormField :label="t('security.code')" for-id="sec-code" :help="t('security.codeHelp')">
          <Input id="sec-code" v-model="code" autocomplete="one-time-code" class="font-mono tracking-widest" />
        </FormField>
        <template v-if="mode === 'password'">
          <FormField :label="t('security.newPassword')" for-id="sec-new-password" :help="t('security.newPasswordHelp', { min: MIN_PASSWORD_LENGTH })">
            <Input id="sec-new-password" v-model="newPassword" type="password" autocomplete="new-password" />
          </FormField>
          <FormField :label="t('security.newPasswordConfirm')" for-id="sec-new-password2">
            <Input id="sec-new-password2" v-model="newPasswordConfirm" type="password" autocomplete="new-password" />
          </FormField>
        </template>
        <p v-if="error" class="text-xs text-destructive">
          {{ error }}
        </p>
        <div class="flex gap-2">
          <Button type="submit" size="sm" :disabled="busy || !currentPassword || !code">
            {{ t(`security.submit.${mode}`) }}
          </Button>
          <Button type="button" variant="ghost" size="sm" @click="reset()">
            {{ t('common.cancel') }}
          </Button>
        </div>
      </form>
    </div>
  </AdminSection>
</template>
