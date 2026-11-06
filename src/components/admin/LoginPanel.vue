<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminSection from '@/components/admin/AdminSection.vue'
import FormField from '@/components/admin/FormField.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api, ApiError } from '@/utils/api'

const emit = defineEmits<{ done: [] }>()
const { t } = useI18n()

const password = ref('')
const code = ref('')
const remember = ref(true)
const busy = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  busy.value = true
  try {
    await api.login(password.value, code.value.trim(), remember.value)
    password.value = ''
    code.value = ''
    emit('done')
  }
  catch (e) {
    error.value = e instanceof ApiError ? e.message : t('login.failed')
    code.value = ''
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto w-full">
    <AdminSection :title="t('login.title')" icon="tabler:lock">
      <form class="flex flex-col gap-4" @submit.prevent="submit">
        <FormField :label="t('login.password')" for-id="login-password">
          <Input id="login-password" v-model="password" type="password" autocomplete="current-password" />
        </FormField>
        <FormField :label="t('login.totp')" for-id="login-code">
          <Input id="login-code" v-model="code" autocomplete="one-time-code" placeholder="123456" class="font-mono tracking-widest" />
        </FormField>
        <label class="flex items-center gap-2 text-sm text-muted-foreground">
          <input v-model="remember" type="checkbox" class="accent-emerald-600 size-4">
          {{ t('login.remember', { days: 30 }) }}
        </label>
        <p v-if="error" class="text-xs text-destructive">
          {{ error }}
        </p>
        <Button type="submit" :disabled="busy || !password || !code">
          {{ t('login.submit') }}
        </Button>
      </form>
    </AdminSection>
  </div>
</template>
