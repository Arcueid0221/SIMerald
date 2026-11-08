/**
 * SIMerald backend API client.
 * State-changing requests send `X-SIMerald-Request` for CSRF protection.
 */
import type { AdminStatus, ApiErrorBody, CardsResponse, ErrorParams, SiteInfo, ThemeSettings } from '@shared/types'
import { currentLocale, i18n, translateError } from '@/i18n'

/**
 * A failed API call. `message` is translated at the time of the failure from the server's error code;
 * `code` / `params` allow re-translating it later.
 */
export class ApiError extends Error {
  status: number
  code: string
  params: ErrorParams

  constructor(status: number, code: string, message: string, params: ErrorParams = {}) {
    super(message)
    this.status = status
    this.code = code
    this.params = params
  }
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
    const message = translateError(code, params, data.error || i18n.global.t('errors.http.requestFailed', { status: response.status }))
    throw new ApiError(response.status, code, message, params)
  }
  return data as T
}

export const api = {
  getSite: () => request<SiteInfo>('GET', '/api/site'),
  /** `lang` picks the language of demo data; synced notes are returned as written */
  getCards: () => request<CardsResponse>('GET', `/api/cards?lang=${currentLocale() === 'zh-CN' ? 'zh' : 'en'}`),

  adminStatus: () => request<AdminStatus>('GET', '/api/admin/status'),
  saveTheme: (theme: ThemeSettings) =>
    request<{ theme_settings: ThemeSettings }>('PUT', '/api/admin/theme', { theme }),
  syncNow: () => request<AdminStatus>('POST', '/api/admin/sync'),
}

/** Cloudflare Access sign-in and sign-out pages for this site */
export const ACCESS_LOGIN_URL = '/admin'
export const ACCESS_LOGOUT_URL = '/cdn-cgi/access/logout'
