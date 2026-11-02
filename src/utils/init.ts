/**
 * 应用初始化：拉取站点信息和卡片数据。
 * 数据每天才同步一次，所以不需要 Komari 那样的 WebSocket 实时推送；
 * 页面停留期间每 10 分钟、或者切回标签页时检查一次即可。
 */

import { watch } from 'vue'
import { useAppStore } from '@/stores/app'
import { useCardsStore } from '@/stores/cards'
import { api } from '@/utils/api'

const REFRESH_INTERVAL_MS = 10 * 60 * 1000

let refreshTimer: ReturnType<typeof setInterval> | null = null
let lastRefreshAt = 0
let visibilityHandler: (() => void) | null = null
let stopTitleWatch: (() => void) | null = null

export async function refreshData(): Promise<void> {
  const appStore = useAppStore()
  const cardsStore = useCardsStore()
  try {
    const [site, cards] = await Promise.all([api.getSite(), api.getCards()])
    appStore.publicSettings = site
    appStore.updateLoginState(site.loggedIn)
    cardsStore.setCards(cards)
    appStore.connectionError = false
    lastRefreshAt = Date.now()
  }
  catch (error) {
    console.error('[init] 拉取数据失败:', error)
    appStore.connectionError = true
    throw error
  }
}

export async function initApp(): Promise<void> {
  const appStore = useAppStore()
  try {
    await refreshData()
  }
  finally {
    appStore.loading = false
  }

  stopTitleWatch = watch(() => appStore.sitename, (name) => {
    document.title = name
  }, { immediate: true })

  refreshTimer = setInterval(() => {
    if (document.visibilityState === 'visible')
      refreshData().catch(() => {})
  }, REFRESH_INTERVAL_MS)

  visibilityHandler = () => {
    if (document.visibilityState === 'visible' && Date.now() - lastRefreshAt > REFRESH_INTERVAL_MS)
      refreshData().catch(() => {})
  }
  document.addEventListener('visibilitychange', visibilityHandler)
}

export function destroyInitManager(): void {
  if (refreshTimer)
    clearInterval(refreshTimer)
  refreshTimer = null
  if (visibilityHandler)
    document.removeEventListener('visibilitychange', visibilityHandler)
  visibilityHandler = null
  stopTitleWatch?.()
  stopTitleWatch = null
}
