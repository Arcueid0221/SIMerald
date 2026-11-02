import type { SiteInfo } from '@shared/types'
import type { ByteDecimalsConfig } from '@/utils/helper'
import { usePreferredDark, useStorageAsync } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

export type ThemeMode = 'auto' | 'light' | 'dark'
type Lang = 'zh-CN' | 'en-US'
export type CardStyle = 'namecard' | 'badge' | 'dial' | 'bar'
type SortMode = 'renewal' | 'notion' | 'name' | 'country'
type EarthViewMode = 'earth' | 'earth-stop' | 'maps' | 'cards' | 'hide'

/** 固定的字节精度配置 */
const BYTE_DECIMALS: ByteDecimalsConfig = {
  B: 0,
  KB: 0,
  MB: 1,
  GB: 1,
  TB: 2,
}

function isValidThemeMode(value: unknown): value is ThemeMode {
  return value === 'auto' || value === 'light' || value === 'dark'
}

export const CARD_STYLES: CardStyle[] = ['namecard', 'badge', 'dial', 'bar']

function isValidCardStyle(value: unknown): value is CardStyle {
  return typeof value === 'string' && (CARD_STYLES as string[]).includes(value)
}

function isValidEarthViewMode(value: unknown): value is EarthViewMode {
  return value === 'earth' || value === 'earth-stop' || value === 'maps' || value === 'cards' || value === 'hide'
}

const useAppStore = defineStore('app', () => {
  const loading = ref<boolean>(true)

  // 使用 VueUse 的 useStorageAsync 实现自动持久化
  const themeMode = useStorageAsync<ThemeMode>('themeMode', 'auto', localStorage)
  const lang = ref<Lang>('zh-CN')
  const publicSettings = ref<SiteInfo>()
  const nodeSelectedGroup = useStorageAsync<string>('cardSelectedGroup', 'all', localStorage)
  const isLoggedIn = ref<boolean>(false)
  const connectionError = ref<boolean>(false)

  // 首页滚动位置记忆
  const homeScrollPosition = ref<number>(0)

  // 访客自己选过的卡片样式；null 表示没选过，跟随站长设置的默认样式
  const storedCardStyle = useStorageAsync<CardStyle | null>('cardStyle', null, localStorage)

  const defaultCardStyle = computed<CardStyle>(() => {
    const style = publicSettings.value?.theme_settings?.defaultCardStyle
    return isValidCardStyle(style) ? style : 'namecard'
  })

  // 当前实际使用的卡片样式
  const cardStyle = computed<CardStyle>({
    get: () => isValidCardStyle(storedCardStyle.value) ? storedCardStyle.value : defaultCardStyle.value,
    set: (val) => {
      storedCardStyle.value = val
    },
  })

  // 计算属性：默认排序方式
  const defaultSort = computed<SortMode>(() => {
    const settings = publicSettings.value?.theme_settings
    const mode = settings?.defaultSort
    if (mode === 'renewal' || mode === 'notion' || mode === 'name' || mode === 'country')
      return mode
    return 'renewal'
  })

  const sitename = computed<string>(() => publicSettings.value?.sitename || 'SIMerald')

  // 字节格式化精度（固定配置）
  const byteDecimals: ByteDecimalsConfig = { ...BYTE_DECIMALS }

  // 计算属性：公告配置
  const alertEnabled = computed<boolean>(() => {
    const settings = publicSettings.value?.theme_settings
    if (settings && typeof settings.alertEnabled === 'boolean') {
      return settings.alertEnabled
    }
    return false
  })

  const alertTitle = computed<string>(() => {
    const settings = publicSettings.value?.theme_settings
    if (settings && typeof settings.alertTitle === 'string') {
      return settings.alertTitle
    }
    return ''
  })

  const alertContent = computed<string>(() => {
    const settings = publicSettings.value?.theme_settings
    if (settings && typeof settings.alertContent === 'string') {
      return settings.alertContent
    }
    return ''
  })

  const earthViewMode = computed<EarthViewMode>(() => {
    const settings = publicSettings.value?.theme_settings
    if (settings && typeof settings.earthViewMode === 'string' && isValidEarthViewMode(settings.earthViewMode)) {
      return settings.earthViewMode
    }
    return 'earth'
  })

  const visitorInfoCardEnabled = computed<boolean>(() => {
    const settings = publicSettings.value?.theme_settings
    if (settings && typeof settings.visitorInfoCardEnabled === 'boolean') {
      return settings.visitorInfoCardEnabled
    }
    return true
  })

  const visitorCountryCode = ref<string | null>(null)

  const hideAdminEntryWhenLoggedOut = computed<boolean>(() => {
    const settings = publicSettings.value?.theme_settings
    if (settings && typeof settings.hideAdminEntryWhenLoggedOut === 'boolean') {
      return settings.hideAdminEntryWhenLoggedOut
    }
    return false
  })

  const disablePageAnimation = computed<boolean>(() => {
    const settings = publicSettings.value?.theme_settings
    if (settings && typeof settings.disablePageAnimation === 'boolean') {
      return settings.disablePageAnimation
    }
    return false
  })

  // 计算属性：已注销后置（默认顺序下已注销的号码排到最后）
  const cancelledLast = computed<boolean>(() => {
    const settings = publicSettings.value?.theme_settings
    if (settings && typeof settings.cancelledLast === 'boolean') {
      return settings.cancelledLast
    }
    return true
  })

  // 计算属性：ICP 备案配置
  const icpEnabled = computed<boolean>(() => {
    const settings = publicSettings.value?.theme_settings
    if (settings && typeof settings.icpEnabled === 'boolean') {
      return settings.icpEnabled
    }
    return false
  })

  const icpNumber = computed<string>(() => {
    const settings = publicSettings.value?.theme_settings
    if (settings && typeof settings.icpNumber === 'string') {
      return settings.icpNumber
    }
    return ''
  })

  const icpUrl = computed<string>(() => {
    const settings = publicSettings.value?.theme_settings
    if (settings && typeof settings.icpUrl === 'string' && settings.icpUrl.trim()) {
      return settings.icpUrl.trim()
    }
    return 'https://beian.miit.gov.cn/'
  })

  // 计算属性：公安备案配置
  const policeEnabled = computed<boolean>(() => {
    const settings = publicSettings.value?.theme_settings
    if (settings && typeof settings.policeEnabled === 'boolean') {
      return settings.policeEnabled
    }
    return false
  })

  const policeNumber = computed<string>(() => {
    const settings = publicSettings.value?.theme_settings
    if (settings && typeof settings.policeNumber === 'string') {
      return settings.policeNumber
    }
    return ''
  })

  const policeUrl = computed<string>(() => {
    const settings = publicSettings.value?.theme_settings
    if (settings && typeof settings.policeUrl === 'string' && settings.policeUrl.trim()) {
      return settings.policeUrl.trim()
    }
    return ''
  })

  // 计算属性：自定义背景配置
  const backgroundEnabled = computed<boolean>(() => {
    const settings = publicSettings.value?.theme_settings
    if (settings && typeof settings.backgroundEnabled === 'boolean') {
      return settings.backgroundEnabled
    }
    return false
  })

  const backgroundType = computed<'image' | 'video'>(() => {
    const settings = publicSettings.value?.theme_settings
    if (settings && typeof settings.backgroundType === 'string') {
      const type = settings.backgroundType
      if (type === 'image' || type === 'video') {
        return type
      }
    }
    return 'image'
  })

  const lightBackgroundUrl = computed<string>(() => {
    const settings = publicSettings.value?.theme_settings
    if (settings && typeof settings.lightBackgroundUrl === 'string') {
      return settings.lightBackgroundUrl.trim()
    }
    return ''
  })

  const darkBackgroundUrl = computed<string>(() => {
    const settings = publicSettings.value?.theme_settings
    if (settings && typeof settings.darkBackgroundUrl === 'string') {
      return settings.darkBackgroundUrl.trim()
    }
    return ''
  })

  const backgroundBlur = computed<number>(() => {
    const settings = publicSettings.value?.theme_settings
    if (settings && typeof settings.backgroundBlur === 'number' && settings.backgroundBlur >= 0) {
      return settings.backgroundBlur
    }
    return 0
  })

  const backgroundOverlay = computed<number>(() => {
    const settings = publicSettings.value?.theme_settings
    if (settings && typeof settings.backgroundOverlay === 'number' && settings.backgroundOverlay >= -100 && settings.backgroundOverlay <= 100) {
      return settings.backgroundOverlay
    }
    return 0
  })

  // 使用 VueUse 的 usePreferredDark 检测系统主题偏好
  const prefersDark = usePreferredDark()

  watch(themeMode, (mode) => {
    if (!isValidThemeMode(mode)) {
      themeMode.value = 'auto'
    }
  }, { immediate: true })

  // 计算当前是否为暗色模式
  const isDark = computed(() => {
    if (themeMode.value === 'auto') {
      return prefersDark.value
    }
    return themeMode.value === 'dark'
  })

  const resolvedThemeMode = computed<'light' | 'dark'>(() => isDark.value ? 'dark' : 'light')

  // 计算属性：当前主题模式下的背景 URL
  const currentBackgroundUrl = computed<string>(() => {
    if (!backgroundEnabled.value) {
      return ''
    }

    if (resolvedThemeMode.value === 'dark') {
      return darkBackgroundUrl.value
    }
    return lightBackgroundUrl.value
  })

  function updateThemeMode(mode?: ThemeMode) {
    if (mode) {
      themeMode.value = isValidThemeMode(mode) ? mode : 'auto'
      return
    }

    const nextMode: Record<ThemeMode, ThemeMode> = {
      auto: 'light',
      light: 'dark',
      dark: 'auto',
    }

    const currentMode = isValidThemeMode(themeMode.value) ? themeMode.value : 'auto'
    themeMode.value = nextMode[currentMode]
  }

  function updateLoginState(loggedIn: boolean) {
    isLoggedIn.value = loggedIn
  }

  return {
    loading,
    themeMode,
    isDark,
    resolvedThemeMode,
    lang,
    nodeSelectedGroup,
    cardStyle,
    defaultCardStyle,
    defaultSort,
    sitename,
    byteDecimals,
    alertEnabled,
    alertTitle,
    alertContent,
    earthViewMode,
    visitorInfoCardEnabled,
    visitorCountryCode,
    hideAdminEntryWhenLoggedOut,
    disablePageAnimation,
    cancelledLast,
    icpEnabled,
    icpNumber,
    icpUrl,
    policeEnabled,
    policeNumber,
    policeUrl,
    backgroundEnabled,
    backgroundType,
    lightBackgroundUrl,
    darkBackgroundUrl,
    currentBackgroundUrl,
    backgroundBlur,
    backgroundOverlay,
    isLoggedIn,
    publicSettings,
    connectionError,
    homeScrollPosition,
    updateThemeMode,
    updateLoginState,
  }
})

export { useAppStore }
