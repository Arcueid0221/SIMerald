<script setup lang="ts">
import type { AdminStatus } from '@shared/types'
import { Icon } from '@iconify/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import LoginPanel from '@/components/admin/LoginPanel.vue'
import NotionSection from '@/components/admin/NotionSection.vue'
import SecuritySection from '@/components/admin/SecuritySection.vue'
import SetupPanel from '@/components/admin/SetupPanel.vue'
import SyncSection from '@/components/admin/SyncSection.vue'
import ThemeSection from '@/components/admin/ThemeSection.vue'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/stores/app'
import { api, ApiError } from '@/utils/api'
import { refreshData } from '@/utils/init'

const router = useRouter()
const appStore = useAppStore()

const status = ref<AdminStatus | null>(null)
const loadingStatus = ref(false)

const mode = computed(() => {
  if (appStore.publicSettings?.setupRequired)
    return 'setup'
  return appStore.isLoggedIn ? 'settings' : 'login'
})

async function loadStatus() {
  if (mode.value !== 'settings')
    return
  loadingStatus.value = true
  try {
    status.value = await api.adminStatus()
  }
  catch (e) {
    if (e instanceof ApiError && e.status === 401)
      await refreshData().catch(() => {})
    else
      window.$message.error(e instanceof ApiError ? e.message : '读取后台状态失败')
  }
  finally {
    loadingStatus.value = false
  }
}

async function handleLoggedIn() {
  await refreshData().catch(() => {})
  await loadStatus()
}

async function logout() {
  try {
    await api.logout()
  }
  finally {
    status.value = null
    await refreshData().catch(() => {})
    window.$message.success('已退出登录')
  }
}

watch(mode, (next) => {
  if (next === 'settings' && !status.value)
    loadStatus()
})

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'instant' })
  loadStatus()
})
</script>

<template>
  <div class="admin-view px-4 pb-8 flex flex-col gap-4">
    <div class="flex gap-4 items-center">
      <Button variant="ghost" size="icon-sm" class="bg-background/50 hover:bg-background" aria-label="返回首页" @click="router.push('/')">
        <Icon icon="tabler:arrow-left" :width="16" :height="16" />
      </Button>
      <div class="text-lg font-bold">
        后台管理
      </div>
      <Button v-if="mode === 'settings'" variant="ghost" size="sm" class="ml-auto bg-background/50 hover:bg-background" @click="logout">
        <Icon icon="tabler:logout" /> 退出登录
      </Button>
    </div>

    <SetupPanel v-if="mode === 'setup'" @done="handleLoggedIn" />
    <LoginPanel v-else-if="mode === 'login'" @done="handleLoggedIn" />
    <template v-else>
      <div v-if="!status" class="py-12 text-center text-sm text-muted-foreground">
        {{ loadingStatus ? '正在读取…' : '读取失败，请刷新页面' }}
      </div>
      <template v-else>
        <SyncSection :status="status" @update="status = $event" />
        <NotionSection :status="status" @update="status = $event" />
        <ThemeSection />
        <SecuritySection :status="status" @changed="loadStatus" />
      </template>
    </template>
  </div>
</template>
