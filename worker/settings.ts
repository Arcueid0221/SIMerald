import type { SettingValue } from '../shared/settings-schema.ts'
import type { Env } from './env.ts'
import { getDefaultSettings, sanitizeSettings } from '../shared/settings-schema.ts'

/** Theme settings and the per-site secret, stored in KV */

const THEME_KEY = 'theme'
const ID_KEY = 'id-key'
const PADDING_REGEX = /=+$/

export async function loadTheme(env: Env): Promise<Record<string, SettingValue>> {
  const raw = await env.STORE.get<Record<string, unknown>>(THEME_KEY, 'json')
  return sanitizeSettings(raw ?? getDefaultSettings())
}

export async function saveTheme(env: Env, input: unknown): Promise<Record<string, SettingValue>> {
  const theme = sanitizeSettings(input)
  await env.STORE.put(THEME_KEY, JSON.stringify(theme))
  return theme
}

export function sitenameOf(theme: Record<string, SettingValue>): string {
  const name = theme.sitename
  return typeof name === 'string' && name.trim() ? name.trim() : 'SIMerald'
}

function toBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(PADDING_REGEX, '')
}

/** Secret for deriving public card IDs from note paths; generated on first use */
async function idKey(env: Env): Promise<string> {
  const existing = await env.STORE.get(ID_KEY)
  if (existing)
    return existing
  const created = toBase64Url(crypto.getRandomValues(new Uint8Array(32)))
  await env.STORE.put(ID_KEY, created)
  return created
}

/** Stable, non-reversible public ID: HMAC-SHA256 of the note path, first 16 hex characters */
export async function makeIdFactory(env: Env): Promise<(path: string) => Promise<string>> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(await idKey(env)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return async (path: string) => {
    const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(path)))
    return Array.from(mac.slice(0, 8), b => b.toString(16).padStart(2, '0')).join('')
  }
}
