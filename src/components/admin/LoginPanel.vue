<script setup lang="ts">
import { ref } from 'vue'
import AdminSection from '@/components/admin/AdminSection.vue'
import FormField from '@/components/admin/FormField.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api, ApiError } from '@/utils/api'

const emit = defineEmits<{ done: [] }>()

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
    error.value = e instanceof ApiError ? e.message : '登录失败'
    code.value = ''
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto w-full">
    <AdminSection title="站长登录" icon="tabler:lock" description="登录后可以看到完整号码和账号信息，并修改站点设置。">
      <form class="flex flex-col gap-4" @submit.prevent="submit">
        <FormField label="密码" for-id="login-password">
          <Input id="login-password" v-model="password" type="password" autocomplete="current-password" />
        </FormField>
        <FormField label="验证码" for-id="login-code" help="手机验证器 App 上的 6 位数字；手机不在身边时可以填一个恢复码">
          <Input id="login-code" v-model="code" autocomplete="one-time-code" placeholder="123456" class="font-mono tracking-widest" />
        </FormField>
        <label class="flex items-center gap-2 text-sm text-muted-foreground">
          <input v-model="remember" type="checkbox" class="accent-emerald-600 size-4">
          在这台设备上保持登录 30 天
        </label>
        <p v-if="error" class="text-xs text-destructive">
          {{ error }}
        </p>
        <Button type="submit" :disabled="busy || !password || !code">
          登录
        </Button>
      </form>
    </AdminSection>
  </div>
</template>
