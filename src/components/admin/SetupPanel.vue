<script setup lang="ts">
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

const emit = defineEmits<{ done: [] }>()
const { t } = useI18n()

/** Mirrors MIN_PASSWORD_LENGTH in server/auth.ts */
const MIN_PASSWORD_LENGTH = 10

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
  if (password.value.length < MIN_PASSWORD_LENGTH) {
    error.value = t('errors.auth.passwordTooShort', { min: MIN_PASSWORD_LENGTH })
    return
  }
  if (password.value !== passwordConfirm.value) {
    error.value = t('setup.passwordMismatch')
    return
  }
  busy.value = true
  try {
    enrollment.value = await api.setupBegin(setupKey.value.trim(), password.value)
    step.value = 2
  }
  catch (e) {
    error.value = e instanceof ApiError ? e.message : t('setup.failed')
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
    error.value = e instanceof ApiError ? e.message : t('setup.verifyFailed')
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto w-full flex flex-col gap-4">
    <AdminSection
      v-if="step === 1" :title="t('setup.step1.title')" icon="tabler:key"
      :description="t('setup.step1.description')"
    >
      <form class="flex flex-col gap-4" @submit.prevent="begin">
        <FormField :label="t('setup.step1.setupKey')" for-id="setup-key" :help="t('setup.step1.setupKeyHelp')">
          <Input id="setup-key" v-model="setupKey" autocomplete="off" placeholder="XXXX-XXXX-XXXX" class="font-mono uppercase" />
        </FormField>
        <FormField :label="t('setup.step1.password')" for-id="setup-password" :help="t('setup.step1.passwordHelp', { min: MIN_PASSWORD_LENGTH })">
          <Input id="setup-password" v-model="password" type="password" autocomplete="new-password" />
        </FormField>
        <FormField :label="t('setup.step1.passwordConfirm')" for-id="setup-password2">
          <Input id="setup-password2" v-model="passwordConfirm" type="password" autocomplete="new-password" />
        </FormField>
        <p v-if="error" class="text-xs text-destructive">
          {{ error }}
        </p>
        <div>
          <Button type="submit" :disabled="busy || !setupKey || !password">
            {{ t('setup.step1.next') }}
          </Button>
        </div>
      </form>
    </AdminSection>

    <AdminSection
      v-else-if="step === 2 && enrollment" :title="t('setup.step2.title')" icon="tabler:shield-lock"
      :description="t('setup.step2.description')"
    >
      <form class="flex flex-col gap-4" @submit.prevent="finish">
        <TotpQr :uri="enrollment.uri" :secret="enrollment.secret" />
        <FormField :label="t('setup.step2.code')" for-id="setup-code">
          <Input id="setup-code" v-model="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="123456" class="font-mono tracking-widest max-w-40" />
        </FormField>
        <p v-if="error" class="text-xs text-destructive">
          {{ error }}
        </p>
        <div>
          <Button type="submit" :disabled="busy || code.length !== 6">
            {{ t('setup.step2.submit') }}
          </Button>
        </div>
      </form>
    </AdminSection>

    <AdminSection v-else :title="t('setup.step3.title')" icon="tabler:lifebuoy">
      <div class="flex flex-col gap-4">
        <RecoveryCodes :codes="recoveryCodes" />
        <label class="flex items-center gap-2 text-sm">
          <input v-model="saved" type="checkbox" class="accent-emerald-600 size-4">
          {{ t('setup.step3.saved') }}
        </label>
        <div>
          <Button :disabled="!saved" @click="emit('done')">
            {{ t('setup.step3.enter') }}
          </Button>
        </div>
      </div>
    </AdminSection>
  </div>
</template>
