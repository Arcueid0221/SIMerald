/**
 * SIMerald backend API client.
 * State-changing requests send `X-SIMerald-Request` for CSRF protection.
 */
import type { AdminStatus, ApiErrorBody, CardsResponse, DetectMatch, ErrorParams, MappingPresetChoice, SiteInfo, ThemeSettings } from '@shared/types'
import { currentLocale, i18n, translateError } from '@/i18n'

/**
 * A failed API call. `message` is translated at the time of the failure from the server's error code;
 * `code` / `params` allow re-translating it later.
 */
export class ApiError extends Error {
  status: number
  code: string
  params: ErrorParams
  retryAfter?: number

  constructor(status: number, code: string, message: string, params: ErrorParams = {}, retryAfter?: number) {
    super(message)
    this.status = status
    this.code = code
    this.params = params
    this.retryAfter = retryAfter
  }
}

export interface TotpEnrollment {
  token: string
  secret: string
  uri: string
}

async function request<T>(method: 'GET' | 'POST' | 'PUT', path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (method !== 'GET') {
    headers['Content-Type'] = 'application/json'
    headers['X-SIMerald-Request'] = '1'
  }

  let response: Response
  try {
    response = await fetch(path, {
      method,
      headers,
      credentials: 'same-origin',
      body: method === 'GET' ? undefined : JSON.stringify(body ?? {}),
    })
  }
  catch {
    throw new ApiError(0, 'http.network', i18n.global.t('errors.http.network'))
  }

  const data = await response.json().catch(() => ({})) as Partial<ApiErrorBody>
  if (!response.ok) {
    const code = data.code ?? 'http.requestFailed'
    const params: ErrorParams = { status: response.status, ...data.params }
    let message = translateError(code, params, data.error || i18n.global.t('errors.http.requestFailed', { status: response.status }))
    if (response.status === 429 && data.retryAfter)
      message = i18n.global.t('errors.retryIn', { message, minutes: Math.ceil(data.retryAfter / 60) })
    throw new ApiError(response.status, code, message, params, data.retryAfter)
  }
  return data as T
}

export const api = {
  getSite: () => request<SiteInfo>('GET', '/api/site'),
  /** `lang` picks the language of demo data; synced Notion data is returned as is */
  getCards: () => request<CardsResponse>('GET', `/api/cards?lang=${currentLocale() === 'zh-CN' ? 'zh' : 'en'}`),

  setupBegin: (setupKey: string, password: string) =>
    request<TotpEnrollment>('POST', '/api/auth/setup/begin', { setupKey, password }),
  setupFinish: (token: string, code: string) =>
    request<{ recoveryCodes: string[] }>('POST', '/api/auth/setup/finish', { token, code }),
  login: (password: string, code: string, remember: boolean) =>
    request<{ ok: true }>('POST', '/api/auth/login', { password, code, remember }),
  logout: () => request<{ ok: true }>('POST', '/api/auth/logout'),

  adminStatus: () => request<AdminStatus>('GET', '/api/admin/status'),
  saveTheme: (theme: ThemeSettings) =>
    request<{ theme_settings: ThemeSettings }>('PUT', '/api/admin/theme', { theme }),
  saveSchedule: (syncTime: string, timezone: string) =>
    request<AdminStatus>('PUT', '/api/admin/schedule', { syncTime, timezone }),
  saveNotion: (payload: { token?: string, clearToken?: boolean, cardsDb: string, recordsDb: string, accountsDb: string, preset: MappingPresetChoice, mapping: string }) =>
    request<AdminStatus>('PUT', '/api/admin/notion', payload),
  detectNotion: (token?: string) =>
    request<{ matches: DetectMatch[] }>('POST', '/api/admin/notion/detect', { token }),
  syncNow: () => request<AdminStatus>('POST', '/api/admin/sync'),
  changePassword: (currentPassword: string, code: string, newPassword: string) =>
    request<{ ok: true }>('POST', '/api/admin/password', { currentPassword, code, newPassword }),
  totpBegin: (currentPassword: string, code: string) =>
    request<TotpEnrollment>('POST', '/api/admin/totp/begin', { currentPassword, code }),
  totpFinish: (token: string, code: string) =>
    request<{ recoveryCodes: string[] }>('POST', '/api/admin/totp/finish', { token, code }),
  regenerateRecovery: (currentPassword: string, code: string) =>
    request<{ recoveryCodes: string[] }>('POST', '/api/admin/recovery', { currentPassword, code }),
  logoutOthers: () => request<{ ok: true }>('POST', '/api/admin/logout-others'),
}
