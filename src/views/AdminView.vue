<script setup lang="ts">
import type { AdminStatus } from '@shared/types'
import { Icon } from '@iconify/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
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
const { t } = useI18n()

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
      window.$message.error(e instanceof ApiError ? e.message : t('admin.statusLoadFailed'))
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
    window.$message.success(t('admin.loggedOut'))
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
      <Button variant="ghost" size="icon-sm" class="bg-background/50 hover:bg-background" :aria-label="t('common.backHome')" @click="router.push('/')">
        <Icon icon="tabler:arrow-left" :width="16" :height="16" />
      </Button>
      <div class="text-lg font-bold">
        {{ t('admin.title') }}
      </div>
      <Button v-if="mode === 'settings'" variant="ghost" size="sm" class="ml-auto bg-background/50 hover:bg-background" @click="logout">
        <Icon icon="tabler:logout" /> {{ t('admin.logout') }}
      </Button>
    </div>

    <SetupPanel v-if="mode === 'setup'" @done="handleLoggedIn" />
    <LoginPanel v-else-if="mode === 'login'" @done="handleLoggedIn" />
    <template v-else>
      <div v-if="!status" class="py-12 text-center text-sm text-muted-foreground">
        {{ loadingStatus ? t('admin.loading') : t('admin.loadFailed') }}
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
