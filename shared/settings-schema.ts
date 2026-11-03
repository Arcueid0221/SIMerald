/**
 * Theme settings schema (corresponds to Emerald's komari-theme.json -> configuration.data).
 * Used by the backend for validation and defaults, and by the frontend settings panel to render forms.
 */

export type SettingType = 'title' | 'switch' | 'string' | 'number' | 'select' | 'richtext'

export interface SettingItem {
  type: SettingType
  key?: string
  name: string
  default?: string | number | boolean
  /** Comma-separated allowed values for select fields */
  options?: string
  /** Comma-separated display labels corresponding to options */
  optionLabels?: string
  help?: string
  min?: number
  max?: number
}

export const SETTINGS_SCHEMA: SettingItem[] = [
  { name: '基础设置', type: 'title' },
  { key: 'sitename', name: '站点标题', type: 'string', default: 'SIMerald', help: '显示在页面左上角和浏览器标签上' },
  { key: 'defaultCardStyle', name: '默认卡片样式', type: 'select', default: 'namecard', options: 'namecard,dial,bar', optionLabels: '名片,表盘,横条', help: '访客第一次打开时看到的卡片样式；访客可以在首页右上角自己切换，浏览器会记住' },
  { key: 'defaultSort', name: '默认排序', type: 'select', default: 'renewal', options: 'renewal,notion,name,country', optionLabels: '按下次续费日期,按 Notion 顺序,按名称,按国家/地区', help: '卡片墙的默认顺序' },

  { name: '公告设置', type: 'title' },
  { key: 'alertEnabled', name: '启用公告', type: 'switch', default: false, help: '在首页显示自定义公告' },
  { key: 'alertTitle', name: '公告标题', type: 'string', default: '', help: '公告的标题内容' },
  { key: 'alertContent', name: '公告内容', type: 'richtext', default: '', help: '公告的详细内容（支持简单 Markdown 格式）' },

  { name: '页面设置', type: 'title' },
  { key: 'earthViewMode', name: '头部展示模式', type: 'select', default: 'earth', options: 'earth,earth-stop,maps,cards,hide', optionLabels: '自转地球,静止地球,点状地图,仅显示头部卡片,隐藏整个头部' },
  { key: 'visitorInfoCardEnabled', name: '访客信息卡片', type: 'switch', default: true, help: '显示访客来源、设备和浏览器信息卡片' },
  { key: 'hideAdminEntryWhenLoggedOut', name: '隐藏后台入口', type: 'switch', default: false, help: '未登录时隐藏顶部后台管理入口' },
  { key: 'disablePageAnimation', name: '减弱过渡动画', type: 'switch', default: false, help: '减少页面过渡动画效果，提升访问速度和响应性' },
  { key: 'cancelledLast', name: '已注销后置', type: 'switch', default: true, help: '开启后已注销的号码排到最后' },

  { name: '备案设置', type: 'title' },
  { key: 'icpEnabled', name: '显示备案号', type: 'switch', default: false, help: '在页脚显示网站备案号' },
  { key: 'icpNumber', name: '备案号', type: 'string', default: '', help: '网站备案号（如：京ICP备12345678号）' },
  { key: 'icpUrl', name: '备案跳转链接', type: 'string', default: 'https://beian.miit.gov.cn/', help: '点击备案号跳转的链接地址' },
  { key: 'policeEnabled', name: '显示公安备案', type: 'switch', default: false, help: '在页脚显示公安备案信息' },
  { key: 'policeNumber', name: '公安备案号', type: 'string', default: '', help: '公安备案号（如：京公网安备 11010502000000号）' },
  { key: 'policeUrl', name: '公安备案跳转链接', type: 'string', default: '', help: '点击公安备案号跳转的链接地址，留空则不跳转' },

  { name: '自定义背景', type: 'title' },
  { key: 'backgroundEnabled', name: '启用自定义背景', type: 'switch', default: false, help: '启用后可设置自定义图片或视频作为页面背景' },
  { key: 'backgroundType', name: '背景类型', type: 'select', default: 'image', options: 'image,video', optionLabels: '图片,视频' },
  { key: 'lightBackgroundUrl', name: '亮色模式背景地址', type: 'string', default: '', help: '亮色模式下的背景图片/视频 URL' },
  { key: 'darkBackgroundUrl', name: '暗色模式背景地址', type: 'string', default: '', help: '暗色模式下的背景图片/视频 URL' },
  { key: 'backgroundBlur', name: '背景模糊半径', type: 'number', default: 0, min: 0, max: 100, help: '背景的高斯模糊半径（单位：px），0 表示不模糊' },
  { key: 'backgroundOverlay', name: '背景遮罩强度', type: 'number', default: 0, min: -100, max: 100, help: '负数降低背景透明度，0 表示关闭，正数为黑色遮罩，绝对值越大效果越明显' },
]

export type SettingValue = string | number | boolean

export function getDefaultSettings(): Record<string, SettingValue> {
  const result: Record<string, SettingValue> = {}
  for (const item of SETTINGS_SCHEMA) {
    if (item.key && item.default !== undefined)
      result[item.key] = item.default
  }
  return result
}

/** Validate and populate settings against the schema, dropping unknown keys and falling back to defaults on invalid values */
export function sanitizeSettings(input: unknown): Record<string, SettingValue> {
  const source = (input && typeof input === 'object') ? input as Record<string, unknown> : {}
  const result = getDefaultSettings()

  for (const item of SETTINGS_SCHEMA) {
    if (!item.key)
      continue
    const value = source[item.key]
    if (value === undefined)
      continue

    switch (item.type) {
      case 'switch':
        if (typeof value === 'boolean')
          result[item.key] = value
        break
      case 'number': {
        const num = typeof value === 'number' ? value : Number(value)
        if (Number.isFinite(num)) {
          const min = item.min ?? -Infinity
          const max = item.max ?? Infinity
          result[item.key] = Math.min(Math.max(num, min), max)
        }
        break
      }
      case 'select': {
        const options = (item.options ?? '').split(',')
        if (typeof value === 'string' && options.includes(value))
          result[item.key] = value
        break
      }
      case 'string':
      case 'richtext':
        if (typeof value === 'string')
          result[item.key] = value.slice(0, item.type === 'richtext' ? 10000 : 500)
        break
    }
  }

  return result
}
