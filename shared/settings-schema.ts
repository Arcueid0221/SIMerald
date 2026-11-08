/**
 * Theme settings schema (corresponds to Emerald's komari-theme.json -> configuration.data).
 * Used by the backend for validation and defaults, and by the frontend settings panel to render forms.
 */

export type SettingType = 'title' | 'switch' | 'string' | 'number' | 'select' | 'richtext'

/**
 * Labels are not stored here: the settings panel looks up `settings.sections.<section>` for titles and
 * `settings.fields.<key>.{name,help,options.<value>}` for fields in the locale dictionaries.
 */
export interface SettingItem {
  type: SettingType
  /** Section id, for `title` items */
  section?: string
  key?: string
  default?: string | number | boolean
  /** Comma-separated allowed values for select fields */
  options?: string
  min?: number
  max?: number
}

export const SETTINGS_SCHEMA: SettingItem[] = [
  { section: 'basic', type: 'title' },
  { key: 'sitename', type: 'string', default: 'SIMerald' },
  { key: 'defaultLanguage', type: 'select', default: 'auto', options: 'auto,zh-CN,en' },
  { key: 'defaultCardStyle', type: 'select', default: 'namecard', options: 'namecard,dial,bar' },
  { key: 'defaultSort', type: 'select', default: 'renewal', options: 'renewal,manual,name,country' },

  { section: 'alert', type: 'title' },
  { key: 'alertEnabled', type: 'switch', default: false },
  { key: 'alertTitle', type: 'string', default: '' },
  { key: 'alertContent', type: 'richtext', default: '' },

  { section: 'page', type: 'title' },
  { key: 'earthViewMode', type: 'select', default: 'earth', options: 'earth,earth-stop,maps,cards,hide' },
  { key: 'visitorInfoCardEnabled', type: 'switch', default: true },
  { key: 'hideAdminEntryWhenLoggedOut', type: 'switch', default: false },
  { key: 'disablePageAnimation', type: 'switch', default: false },
  { key: 'cancelledLast', type: 'switch', default: true },

  { section: 'icp', type: 'title' },
  { key: 'icpEnabled', type: 'switch', default: false },
  { key: 'icpNumber', type: 'string', default: '' },
  { key: 'icpUrl', type: 'string', default: 'https://beian.miit.gov.cn/' },
  { key: 'policeEnabled', type: 'switch', default: false },
  { key: 'policeNumber', type: 'string', default: '' },
  { key: 'policeUrl', type: 'string', default: '' },

  { section: 'background', type: 'title' },
  { key: 'backgroundEnabled', type: 'switch', default: false },
  { key: 'backgroundType', type: 'select', default: 'image', options: 'image,video' },
  { key: 'lightBackgroundUrl', type: 'string', default: '' },
  { key: 'darkBackgroundUrl', type: 'string', default: '' },
  { key: 'backgroundBlur', type: 'number', default: 0, min: 0, max: 100 },
  { key: 'backgroundOverlay', type: 'number', default: 0, min: -100, max: 100 },
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
