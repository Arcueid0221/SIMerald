import type { IncomingMessage, ServerResponse } from 'node:http'
import type { AdminStatus, ApiErrorBody, CardsResponse, SiteInfo, SyncReason } from '../shared/types.ts'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import path from 'node:path'
import { AuthService } from './auth.ts'
import { loadConfig } from './config.ts'
import { detectTemplates } from './detect.ts'
import { AppError } from './errors.ts'
import { LogoStore } from './logos.ts'
import { NotionClient, NotionError } from './notion.ts'
import { SettingsService } from './settings.ts'
import { JsonStore } from './storage.ts'
import { SyncService } from './sync.ts'
import { toPublicCards } from './view.ts'

const SESSION_COOKIE = 'simerald_session'
const MAX_BODY_BYTES = 64 * 1024
const CSRF_HEADER = 'x-simerald-request'

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}

/** Sent only over HTTPS: 1-year HSTS without includeSubDomains or preload */
const HSTS_VALUE = 'max-age=31536000'

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    'default-src \'self\'',
    'script-src \'self\'',
    'style-src \'self\' \'unsafe-inline\'',
    'img-src \'self\' data: blob: https:',
    'media-src \'self\' https:',
    'connect-src \'self\' https:',
    'font-src \'self\' data:',
    'frame-ancestors \'none\'',
    'base-uri \'self\'',
    'form-action \'self\'',
    'object-src \'none\'',
  ].join('; '),
}

const config = loadConfig()
const store = new JsonStore(config.dataDir)
const settings = new SettingsService(store, config)
const auth = new AuthService(store)
const sync = new SyncService(store, settings)
const logos = new LogoStore(config.dataDir)

function parseCookies(header: string | undefined): Record<string, string> {
  const result: Record<string, string> = {}
  if (!header)
    return result
  for (const part of header.split(';')) {
    const index = part.indexOf('=')
    if (index === -1)
      continue
    const name = part.slice(0, index).trim()
    const value = part.slice(index + 1).trim()
    if (!name)
      continue
    try {
      result[name] = decodeURIComponent(value)
    }
    catch {
      // Ignore malformed cookies
    }
  }
  return result
}

/** Client IP from the header configured via TRUST_PROXY; ignores proxy headers when unset */
function clientIp(req: IncomingMessage): string {
  if (config.trustProxy === 'cloudflare') {
    const cf = req.headers['cf-connecting-ip']
    if (typeof cf === 'string' && cf.trim())
      return cf.trim()
  }
  if (config.trustProxy === 'xff') {
    // Reverse proxies append the client IP at the end; earlier entries can be spoofed by the client
    const forwarded = req.headers['x-forwarded-for']
    const last = typeof forwarded === 'string' ? forwarded.split(',').at(-1)?.trim() : ''
    if (last)
      return last
  }
  return req.socket.remoteAddress ?? 'unknown'
}

function isHttps(req: IncomingMessage): boolean {
  return req.headers['x-forwarded-proto'] === 'https' || (req.socket as { encrypted?: boolean }).encrypted === true
}

function sessionToken(req: IncomingMessage): string | undefined {
  return parseCookies(req.headers.cookie)[SESSION_COOKIE]
}

function isLoggedIn(req: IncomingMessage): boolean {
  return auth.isValidSession(sessionToken(req))
}

function setSessionCookie(req: IncomingMessage, res: ServerResponse, token: string, maxAgeSeconds?: number): void {
  const parts = [`${SESSION_COOKIE}=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Strict']
  if (isHttps(req))
    parts.push('Secure')
  if (maxAgeSeconds)
    parts.push(`Max-Age=${maxAgeSeconds}`)
  res.setHeader('Set-Cookie', parts.join('; '))
}

function clearSessionCookie(req: IncomingMessage, res: ServerResponse): void {
  const parts = [`${SESSION_COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Strict', 'Max-Age=0']
  if (isHttps(req))
    parts.push('Secure')
  res.setHeader('Set-Cookie', parts.join('; '))
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    ...SECURITY_HEADERS,
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(payload),
  })
  res.end(payload)
}

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const type = req.headers['content-type'] ?? ''
  if (!type.includes('application/json'))
    throw new AppError(415, 'http.unsupportedMediaType', 'Expected an application/json body')
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    size += (chunk as Buffer).length
    if (size > MAX_BODY_BYTES)
      throw new AppError(413, 'http.payloadTooLarge', 'Request body is too large')
    chunks.push(chunk as Buffer)
  }
  if (!chunks.length)
    return {}
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf-8'))
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {}
  }
  catch {
    throw new AppError(400, 'http.badJson', 'Request body is not valid JSON')
  }
}

function requireLogin(req: IncomingMessage): void {
  if (!isLoggedIn(req))
    throw new AppError(401, 'auth.loginRequired', 'Please log in first')
}

function siteInfo(req: IncomingMessage): SiteInfo {
  const { syncedAt, demo } = sync.getCards()
  return {
    sitename: settings.sitename,
    version: config.version,
    gitHash: config.gitHash,
    demo,
    syncedAt,
    loggedIn: isLoggedIn(req),
    setupRequired: auth.isSetupRequired(),
    theme_settings: settings.theme,
  }
}

function adminStatus(): AdminStatus {
  const notion = settings.notion
  return {
    sync: sync.getStatus(),
    notion: {
      tokenConfigured: !!notion.token,
      tokenFromEnv: notion.tokenFromEnv,
      ...settings.notionForm,
    },
    syncTime: settings.syncTime,
    timezone: settings.timezone,
    recoveryCodesLeft: auth.recoveryCodesLeft(),
    sessions: auth.sessionCount(),
  }
}

async function runSyncForResponse(reason: SyncReason): Promise<void> {
  try {
    await sync.run(reason)
  }
  catch {
    // Sync errors are recorded in sync status and read by the frontend from there
  }
}

type Handler = (req: IncomingMessage, res: ServerResponse) => Promise<void> | void

const routes: Record<string, Handler> = {
  'GET /healthz': (_req, res) => sendJson(res, 200, { ok: true }),

  'GET /api/site': (req, res) => sendJson(res, 200, siteInfo(req)),

  'GET /api/cards': (req, res) => {
    const full = isLoggedIn(req)
    const lang = new URL(req.url ?? '/', 'http://localhost').searchParams.get('lang') === 'en' ? 'en' : 'zh'
    const { cards: rawCards, syncedAt, demo } = sync.getCards(lang)
    const cards = rawCards.map(card => ({ ...card, logo: logos.urlFor(card.carrier) }))
    const body: CardsResponse = { cards: full ? cards : toPublicCards(cards), syncedAt, demo, full }
    sendJson(res, 200, body)
  },

  'POST /api/auth/setup/begin': async (req, res) => {
    const body = await readJsonBody(req)
    sendJson(res, 200, auth.beginSetup(clientIp(req), body.setupKey, body.password))
  },

  'POST /api/auth/setup/finish': async (req, res) => {
    const body = await readJsonBody(req)
    const { session, recoveryCodes } = auth.finishSetup(clientIp(req), body.token, body.code)
    setSessionCookie(req, res, session.token, session.maxAgeSeconds)
    sendJson(res, 200, { recoveryCodes })
  },

  'POST /api/auth/login': async (req, res) => {
    const body = await readJsonBody(req)
    const session = auth.login(clientIp(req), body.password, body.code, body.remember)
    setSessionCookie(req, res, session.token, session.maxAgeSeconds)
    sendJson(res, 200, { ok: true })
  },

  'POST /api/auth/logout': (req, res) => {
    auth.logout(sessionToken(req))
    clearSessionCookie(req, res)
    sendJson(res, 200, { ok: true })
  },

  'GET /api/admin/status': (req, res) => {
    requireLogin(req)
    sendJson(res, 200, adminStatus())
  },

  'PUT /api/admin/theme': async (req, res) => {
    requireLogin(req)
    const body = await readJsonBody(req)
    sendJson(res, 200, { theme_settings: settings.updateTheme(body.theme) })
  },

  'PUT /api/admin/schedule': async (req, res) => {
    requireLogin(req)
    const body = await readJsonBody(req)
    settings.updateSchedule(body.syncTime, body.timezone)
    sync.schedule()
    sendJson(res, 200, adminStatus())
  },

  'PUT /api/admin/notion': async (req, res) => {
    requireLogin(req)
    const body = await readJsonBody(req)
    settings.updateNotion(body)
    if (settings.notion.token)
      await runSyncForResponse('settings')
    sendJson(res, 200, adminStatus())
  },

  'POST /api/admin/notion/detect': async (req, res) => {
    requireLogin(req)
    const body = await readJsonBody(req)
    // A token typed into the form but not saved yet can be used for detection
    const typed = typeof body.token === 'string' ? body.token.trim() : ''
    const token = typed || settings.notion.token
    if (!token)
      throw new AppError(400, 'notion.tokenRequired', 'Enter a Notion token first')
    if (typed && (typed.length < 20 || typed.length > 200))
      throw new AppError(400, 'notion.badToken', 'Malformed Notion token')
    try {
      sendJson(res, 200, { matches: await detectTemplates(new NotionClient(token)) })
    }
    catch (error) {
      // Notion's own status (e.g. 401) must not reach the browser, where it would read as a lost session
      if (error instanceof NotionError)
        throw new AppError(400, error.appCode, error.message, error.params)
      throw error
    }
  },

  'POST /api/admin/sync': async (req, res) => {
    requireLogin(req)
    await readJsonBody(req)
    await runSyncForResponse('manual')
    sendJson(res, 200, adminStatus())
  },

  'POST /api/admin/password': async (req, res) => {
    requireLogin(req)
    const body = await readJsonBody(req)
    auth.changePassword(clientIp(req), body.currentPassword, body.code, body.newPassword, sessionToken(req))
    sendJson(res, 200, { ok: true })
  },

  'POST /api/admin/totp/begin': async (req, res) => {
    requireLogin(req)
    const body = await readJsonBody(req)
    sendJson(res, 200, auth.beginRebind(clientIp(req), body.currentPassword, body.code))
  },

  'POST /api/admin/totp/finish': async (req, res) => {
    requireLogin(req)
    const body = await readJsonBody(req)
    sendJson(res, 200, { recoveryCodes: auth.finishRebind(clientIp(req), body.token, body.code) })
  },

  'POST /api/admin/recovery': async (req, res) => {
    requireLogin(req)
    const body = await readJsonBody(req)
    sendJson(res, 200, { recoveryCodes: auth.regenerateRecoveryCodes(clientIp(req), body.currentPassword, body.code) })
  },

  'POST /api/admin/logout-others': async (req, res) => {
    requireLogin(req)
    await readJsonBody(req)
    auth.logoutOthers(sessionToken(req))
    sendJson(res, 200, { ok: true })
  },
}

function serveStatic(req: IncomingMessage, res: ServerResponse, pathname: string): void {
  const root = path.resolve(config.staticDir)
  let decoded: string
  try {
    decoded = decodeURIComponent(pathname)
  }
  catch {
    throw new AppError(400, 'http.badUrl', 'Malformed URL')
  }
  let filePath = path.resolve(root, `.${decoded}`)
  if (!filePath.startsWith(root + path.sep) && filePath !== root) {
    res.writeHead(403, SECURITY_HEADERS).end()
    return
  }

  let isFallback = false
  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    // Missing paths with a file extension are real 404s; other paths fall back to the SPA router
    if (path.extname(pathname)) {
      res.writeHead(404, { ...SECURITY_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' }).end('Not Found')
      return
    }
    filePath = path.join(root, 'index.html')
    isFallback = true
    if (!existsSync(filePath)) {
      res.writeHead(503, { ...SECURITY_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' }).end('Frontend not built yet')
      return
    }
  }

  const ext = path.extname(filePath).toLowerCase()
  const immutable = !isFallback && pathname.startsWith('/assets/') && !pathname.startsWith('/assets/flags/')
  res.writeHead(200, {
    ...SECURITY_HEADERS,
    'Content-Type': MIME_TYPES[ext] ?? 'application/octet-stream',
    'Cache-Control': ext === '.html' ? 'no-cache' : immutable ? 'public, max-age=31536000, immutable' : 'public, max-age=86400',
  })
  if (req.method === 'HEAD') {
    res.end()
    return
  }
  createReadStream(filePath).pipe(res)
}

/** Redirect HTTP requests behind a reverse proxy to HTTPS; direct connections (e.g. container health checks) are unaffected */
function redirectToHttps(req: IncomingMessage, res: ServerResponse, method: string): boolean {
  const host = req.headers.host
  if (config.trustProxy === 'none' || req.headers['x-forwarded-proto'] !== 'http' || !host)
    return false
  // Use 301 for GET/HEAD and 308 for other methods to preserve the request method and body
  res.writeHead(method === 'GET' || method === 'HEAD' ? 301 : 308, {
    ...SECURITY_HEADERS,
    'Location': `https://${host}${req.url ?? '/'}`,
    'Cache-Control': 'no-store',
  }).end()
  return true
}

const server = createServer(async (req, res) => {
  const method = req.method ?? 'GET'

  try {
    if (redirectToHttps(req, res, method))
      return
    if (isHttps(req))
      res.setHeader('Strict-Transport-Security', HSTS_VALUE)
    let url: URL
    try {
      url = new URL(req.url ?? '/', 'http://localhost')
    }
    catch {
      throw new AppError(400, 'http.badUrl', 'Malformed URL')
    }
    if (url.pathname.startsWith('/api/') || url.pathname === '/healthz') {
      if (method !== 'GET' && method !== 'HEAD' && req.headers[CSRF_HEADER] !== '1')
        throw new AppError(403, 'http.csrf', 'Missing the X-SIMerald-Request header')
      const handler = routes[`${method === 'HEAD' ? 'GET' : method} ${url.pathname}`]
      if (!handler)
        throw new AppError(404, 'http.notFound', 'No such API endpoint')
      await handler(req, res)
      return
    }
    if (method !== 'GET' && method !== 'HEAD')
      throw new AppError(405, 'http.methodNotAllowed', 'Method not allowed')
    if (url.pathname.startsWith('/logos/')) {
      if (!logos.serve(req, res, url.pathname, SECURITY_HEADERS))
        res.writeHead(404, { ...SECURITY_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' }).end('Not Found')
      return
    }
    serveStatic(req, res, url.pathname)
  }
  catch (error) {
    if (res.headersSent) {
      res.end()
      return
    }
    if (error instanceof AppError) {
      if (error.retryAfter)
        res.setHeader('Retry-After', String(error.retryAfter))
      const body: ApiErrorBody = { error: error.message, code: error.code, params: error.params, retryAfter: error.retryAfter }
      sendJson(res, error.status, body)
      return
    }
    console.error('[http] Unhandled error:', error)
    const body: ApiErrorBody = { error: 'Internal server error', code: 'http.internal' }
    sendJson(res, 500, body)
  }
})

server.listen(config.port, config.host, () => {
  console.log(`[simerald] v${config.version} listening on http://${config.host}:${config.port} (data dir: ${config.dataDir})`)
  console.log(`[simerald] Client IP source: ${config.trustProxy === 'cloudflare' ? 'CF-Connecting-IP' : config.trustProxy === 'xff' ? 'last X-Forwarded-For entry' : 'socket remote address (TRUST_PROXY=none)'}`)
  console.log(sync.isDemo() ? '[simerald] Notion token not configured; serving demo data' : '[simerald] Notion configured; syncing daily')
  sync.start()
})

function shutdown(signal: string): void {
  console.log(`[simerald] Received ${signal}, shutting down`)
  sync.stop()
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(0), 3000).unref()
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
