import type { AdminStatus, ApiErrorBody, CardsResponse, SimCard, SiteInfo } from '../shared/types.ts'
import type { Env } from './env.ts'
import pkg from '../package.json'
import { adminEmail } from './access.ts'
import { todayIn, withToday } from './cards.ts'
import { buildDemoCards } from './demo.ts'
import { AppError } from './errors.ts'
import { logoKey, serveLogo } from './logos.ts'
import { loadTheme, saveTheme, sitenameOf } from './settings.ts'
import { loadSnapshot, loadStatus, runSync } from './sync.ts'
import { toPublicCards } from './view.ts'

/**
 * Worker entry. Static files (the Vue app) are served by Workers Static Assets before this code runs;
 * only /api/* and /logos/* reach it (see `assets.run_worker_first` in wrangler.jsonc).
 */

const MAX_BODY_BYTES = 64 * 1024
const CSRF_HEADER = 'X-SIMerald-Request'

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...SECURITY_HEADERS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  if (!(request.headers.get('Content-Type') ?? '').includes('application/json'))
    throw new AppError(415, 'http.unsupportedMediaType', 'Expected an application/json body')
  const text = await request.text()
  if (text.length > MAX_BODY_BYTES)
    throw new AppError(413, 'http.payloadTooLarge', 'Request body is too large')
  if (!text)
    return {}
  try {
    const parsed = JSON.parse(text) as unknown
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {}
  }
  catch {
    throw new AppError(400, 'http.badJson', 'Request body is not valid JSON')
  }
}

interface Context {
  request: Request
  env: Env
  url: URL
  /** Signed-in owner's email, or null */
  email: string | null
}

async function cardsFor(ctx: Context): Promise<CardsResponse> {
  const snapshot = await loadSnapshot(ctx.env)
  const full = ctx.email !== null
  if (!snapshot) {
    const lang = ctx.url.searchParams.get('lang') === 'en' ? 'en' : 'zh'
    const demo = buildDemoCards(lang)
    return { cards: full ? demo : toPublicCards(demo), syncedAt: null, demo: true, full }
  }
  const today = todayIn(ctx.env.TIMEZONE)
  const cards: SimCard[] = snapshot.cards.map(stored => ({
    ...withToday(stored, today),
    logo: snapshot.logos[logoKey(stored.carrier)] ?? null,
  }))
  return { cards: full ? cards : toPublicCards(cards), syncedAt: snapshot.syncedAt, demo: false, full }
}

async function adminStatus(ctx: Context): Promise<AdminStatus> {
  return { sync: await loadStatus(ctx.env), email: ctx.email, cardsFolder: ctx.env.CARDS_FOLDER }
}

function requireAdmin(ctx: Context): void {
  if (!ctx.email)
    throw new AppError(401, 'auth.loginRequired', 'Sign in through Cloudflare Access first')
}

type Handler = (ctx: Context) => Promise<Response>

const routes: Record<string, Handler> = {
  'GET /api/site': async (ctx) => {
    const [theme, snapshot] = await Promise.all([loadTheme(ctx.env), loadSnapshot(ctx.env)])
    const body: SiteInfo = {
      sitename: sitenameOf(theme),
      version: pkg.version,
      gitHash: ctx.env.GIT_HASH ?? 'dev',
      demo: !snapshot,
      syncedAt: snapshot?.syncedAt ?? null,
      loggedIn: ctx.email !== null,
      theme_settings: theme,
    }
    return json(200, body)
  },

  'GET /api/cards': async ctx => json(200, await cardsFor(ctx)),

  'GET /api/admin/status': async (ctx) => {
    requireAdmin(ctx)
    return json(200, await adminStatus(ctx))
  },

  'PUT /api/admin/theme': async (ctx) => {
    requireAdmin(ctx)
    const body = await readJsonBody(ctx.request)
    return json(200, { theme_settings: await saveTheme(ctx.env, body.theme) })
  },

  'POST /api/admin/sync': async (ctx) => {
    requireAdmin(ctx)
    await readJsonBody(ctx.request)
    await runSync(ctx.env)
    return json(200, await adminStatus(ctx))
  },
}

async function handle(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const method = request.method

  if (url.pathname.startsWith('/logos/')) {
    if (method !== 'GET' && method !== 'HEAD')
      throw new AppError(405, 'http.methodNotAllowed', 'Method not allowed')
    return await serveLogo(env, env.LOGOS_FOLDER, url.pathname)
      ?? new Response('Not Found', { status: 404, headers: SECURITY_HEADERS })
  }

  if (!url.pathname.startsWith('/api/'))
    return env.ASSETS.fetch(request)

  // A custom header cannot be sent cross-site without a CORS preflight, which this API never allows
  if (method !== 'GET' && method !== 'HEAD' && request.headers.get(CSRF_HEADER) !== '1')
    throw new AppError(403, 'http.csrf', `Missing the ${CSRF_HEADER} header`)
  const handler = routes[`${method === 'HEAD' ? 'GET' : method} ${url.pathname}`]
  if (!handler)
    throw new AppError(404, 'http.notFound', 'No such API endpoint')
  return handler({ request, env, url, email: await adminEmail(request, env) })
}

export default {
  async fetch(request, env): Promise<Response> {
    try {
      return await handle(request, env)
    }
    catch (error) {
      if (error instanceof AppError) {
        const body: ApiErrorBody = { error: error.message, code: error.code, params: error.params }
        return json(error.status, body)
      }
      console.error('[http] Unhandled error:', error)
      const body: ApiErrorBody = { error: 'Internal server error', code: 'http.internal' }
      return json(500, body)
    }
  },
} satisfies ExportedHandler<Env>
