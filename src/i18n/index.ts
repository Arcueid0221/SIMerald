/**
 * UI translations (vue-i18n, Composition API mode).
 *
 * `locales/zh-CN.ts` is the source dictionary and defines the message schema; `locales/en.ts` must
 * provide every key. Messages are compiled at runtime by vue-i18n's JIT compiler, which does not use
 * `eval`, so the `script-src 'self'` CSP keeps working.
 */
import type { ErrorParams } from '@shared/types'
import { createI18n } from 'vue-i18n'
import en from './locales/en'
import zhCN from './locales/zh-CN'

export type AppLocale = 'zh-CN' | 'en'
export type MessageSchema = typeof zhCN

export const LOCALES: AppLocale[] = ['zh-CN', 'en']

declare module 'vue-i18n' {
  export interface DefineLocaleMessage extends MessageSchema {}
}

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === 'string' && (LOCALES as string[]).includes(value)
}

/** Chinese browsers (any region or script) get Chinese; everyone else gets English */
export function browserLocale(): AppLocale {
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const language of languages) {
    const lower = language?.toLowerCase() ?? ''
    if (lower.startsWith('zh'))
      return 'zh-CN'
    if (lower.startsWith('en'))
      return 'en'
  }
  return 'en'
}

export const i18n = createI18n<[MessageSchema], AppLocale, false>({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'zh-CN',
  messages: { 'zh-CN': zhCN, 'en': en },
})

export function currentLocale(): AppLocale {
  return i18n.global.locale.value
}

export function setLocale(locale: AppLocale): void {
  i18n.global.locale.value = locale
  document.documentElement.lang = locale
}

/** Translates a key built at runtime (error codes, option values); returns `fallback` when the key does not exist */
export function translateKey(key: string, params: Record<string, unknown> = {}, fallback = key): string {
  const { t, te } = i18n.global as unknown as {
    t: (key: string, params: Record<string, unknown>) => string
    te: (key: string) => boolean
  }
  return te(key) ? t(key, params) : fallback
}

/**
 * Translates an API or sync error code. A `cause` param holding another code is translated first, so
 * nested failures (e.g. a Notion error inside a sync warning) read naturally. `fallback` is shown for
 * unknown codes and for messages stored before codes existed.
 */
export function translateError(code: string | null | undefined, params: ErrorParams | null | undefined, fallback: string): string {
  if (!code)
    return fallback
  const values: Record<string, unknown> = { ...params }
  if (typeof params?.cause === 'string')
    values.cause = translateKey(`errors.${params.cause}`, values, String(params.message ?? params.cause))
  return translateKey(`errors.${code}`, values, fallback)
}

/** Locale-aware number formatting (grouping separators, decimals) */
export function formatNumber(value: number, options: Intl.NumberFormatOptions = {}): string {
  return new Intl.NumberFormat(currentLocale(), options).format(value)
}

/** Locale-aware string comparison for sorting */
export function compareText(a: string, b: string): number {
  return a.localeCompare(b, currentLocale())
}
