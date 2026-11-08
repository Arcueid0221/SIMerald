import type { Env } from './env.ts'

/**
 * Who is signed in, according to Cloudflare Access.
 *
 * Access sits in front of /admin and /api/admin and blocks anyone who has not signed in. Its login cookie
 * (`CF_Authorization`) is then sent with every request to the site, so the public pages can also show the
 * owner's private fields. The token is verified here against the team's public keys either way, so a
 * forged cookie or a misconfigured Access application never grants anything.
 */

interface Jwk extends JsonWebKey {
  kid: string
}

const KEYS_TTL_MS = 60 * 60 * 1000
let keyCache: { domain: string, at: number, keys: Map<string, CryptoKey> } | null = null

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])
const TRAILING_SLASHES_REGEX = /\/+$/

function base64UrlDecode(input: string): Uint8Array {
  const base64 = input.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(input.length / 4) * 4, '=')
  const binary = atob(base64)
  return Uint8Array.from(binary, c => c.charCodeAt(0))
}

function decodeJson<T>(part: string): T {
  return JSON.parse(new TextDecoder().decode(base64UrlDecode(part))) as T
}

async function loadKeys(domain: string, force: boolean): Promise<Map<string, CryptoKey>> {
  if (!force && keyCache && keyCache.domain === domain && Date.now() - keyCache.at < KEYS_TTL_MS)
    return keyCache.keys
  const response = await fetch(`${domain}/cdn-cgi/access/certs`)
  if (!response.ok)
    throw new Error(`Access certs request failed with HTTP ${response.status}`)
  const body = await response.json() as { keys?: Jwk[] }
  const keys = new Map<string, CryptoKey>()
  for (const jwk of body.keys ?? []) {
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'])
    keys.set(jwk.kid, key)
  }
  keyCache = { domain, at: Date.now(), keys }
  return keys
}

function readCookie(header: string | null, name: string): string | null {
  for (const part of header?.split(';') ?? []) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name)
      return rest.join('=') || null
  }
  return null
}

async function verify(token: string, env: Env): Promise<string | null> {
  const parts = token.split('.')
  if (parts.length !== 3)
    return null
  const [headerPart, payloadPart, signaturePart] = parts as [string, string, string]
  let header: { alg?: string, kid?: string }
  let payload: { aud?: string | string[], iss?: string, exp?: number, nbf?: number, email?: string }
  try {
    header = decodeJson(headerPart)
    payload = decodeJson(payloadPart)
  }
  catch {
    return null
  }
  if (header.alg !== 'RS256' || !header.kid)
    return null

  const domain = env.ACCESS_TEAM_DOMAIN.replace(TRAILING_SLASHES_REGEX, '')
  let keys = await loadKeys(domain, false)
  if (!keys.has(header.kid))
    keys = await loadKeys(domain, true) // keys rotate; refetch once
  const key = keys.get(header.kid)
  if (!key)
    return null

  const data = new TextEncoder().encode(`${headerPart}.${payloadPart}`)
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, base64UrlDecode(signaturePart), data)
  if (!valid)
    return null

  const now = Math.floor(Date.now() / 1000)
  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud]
  if (!audiences.includes(env.ACCESS_AUD) || payload.iss !== domain)
    return null
  if (!payload.exp || payload.exp < now || (payload.nbf && payload.nbf > now + 60))
    return null
  return payload.email ?? null
}

/** Email of the signed-in owner, or null for visitors */
export async function adminEmail(request: Request, env: Env): Promise<string | null> {
  const url = new URL(request.url)
  // `wrangler dev` has no Access in front of it; .dev.vars can stand in for a login on localhost only
  if (env.DEV_ADMIN_EMAIL && LOCAL_HOSTS.has(url.hostname))
    return env.DEV_ADMIN_EMAIL
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD)
    return null
  const token = request.headers.get('Cf-Access-Jwt-Assertion') ?? readCookie(request.headers.get('Cookie'), 'CF_Authorization')
  if (!token)
    return null
  try {
    return await verify(token, env)
  }
  catch (error) {
    console.error('[access] Could not verify the login token:', error)
    return null
  }
}
