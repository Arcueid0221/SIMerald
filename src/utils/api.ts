/**
 * SIMerald 后端接口。
 * 所有修改类请求都带 X-SIMerald-Request 头，后端靠它防跨站请求伪造。
 */
import type { AdminStatus, CardsResponse, SiteInfo, ThemeSettings } from '@shared/types'

export class ApiError extends Error {
  status: number
  retryAfter?: number

  constructor(status: number, message: string, retryAfter?: number) {
    super(message)
    this.status = status
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
    throw new ApiError(0, '连接服务器失败，请检查网络')
  }

  const data = await response.json().catch(() => ({})) as { error?: string, retryAfter?: number }
  if (!response.ok) {
    let message = data.error || `请求失败（${response.status}）`
    if (response.status === 429 && data.retryAfter)
      message = `${message}（约 ${Math.ceil(data.retryAfter / 60)} 分钟后）`
    throw new ApiError(response.status, message, data.retryAfter)
  }
  return data as T
}

export const api = {
  getSite: () => request<SiteInfo>('GET', '/api/site'),
  getCards: () => request<CardsResponse>('GET', '/api/cards'),

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
  saveNotion: (payload: { token?: string, clearToken?: boolean, cardsDb: string, recordsDb: string, accountsDb: string, mapping: string }) =>
    request<AdminStatus>('PUT', '/api/admin/notion', payload),
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
