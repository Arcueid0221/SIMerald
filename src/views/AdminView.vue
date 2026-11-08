<script setup lang="ts">
import type { AdminStatus } from '@shared/types'
import { Icon } from '@iconify/vue'
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import AdminSection from '@/components/admin/AdminSection.vue'
import SyncSection from '@/components/admin/SyncSection.vue'
import ThemeSection from '@/components/admin/ThemeSection.vue'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/stores/app'
import { ACCESS_LOGIN_URL, ACCESS_LOGOUT_URL, api, ApiError } from '@/utils/api'

const router = useRouter()
const appStore = useAppStore()
const { t } = useI18n()

const status = ref<AdminStatus | null>(null)
const loadingStatus = ref(false)
/** True when the Access session ended while the page was open */
const sessionExpired = ref(false)

async function loadStatus() {
  if (!appStore.isLoggedIn)
    return
  loadingStatus.value = true
  try {
    status.value = await api.adminStatus()
  }
  catch (e) {
    // An expired Access session answers /api/admin with a redirect to the login page, which fetch cannot follow
    if (e instanceof ApiError && (e.status === 0 || e.status === 401))
      sessionExpired.value = true
    else
      window.$message.error(e instanceof ApiError ? e.message : t('admin.statusLoadFailed'))
  }
  finally {
    loadingStatus.value = false
  }
}

/** Full page load so Cloudflare Access can show its login page */
function signIn() {
  window.location.assign(ACCESS_LOGIN_URL)
}

function signOut() {
  window.location.assign(ACCESS_LOGOUT_URL)
}

watch(() => appStore.isLoggedIn, (loggedIn) => {
  if (loggedIn && !status.value)
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
      <span v-if="status?.email" class="text-xs text-muted-foreground truncate">{{ status.email }}</span>
      <Button v-if="appStore.isLoggedIn" variant="ghost" size="sm" class="ml-auto bg-background/50 hover:bg-background" @click="signOut">
        <Icon icon="tabler:logout" /> {{ t('admin.logout') }}
      </Button>
    </div>

    <AdminSection
      v-if="!appStore.isLoggedIn || sessionExpired"
      :title="sessionExpired ? t('admin.signIn.expiredTitle') : t('admin.signIn.title')"
      icon="tabler:lock"
      :description="t('admin.signIn.description')"
    >
      <Button @click="signIn">
        <Icon icon="tabler:login-2" /> {{ t('admin.signIn.button') }}
      </Button>
    </AdminSection>
    <template v-else>
      <div v-if="!status" class="py-12 text-center text-sm text-muted-foreground">
        {{ loadingStatus ? t('admin.loading') : t('admin.loadFailed') }}
      </div>
      <template v-else>
        <SyncSection :status="status" @update="status = $event" />
        <ThemeSection />
      </template>
    </template>
  </div>
</template>
