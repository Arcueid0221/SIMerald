import type { ErrorParams, FieldIssue, SimCard, SyncReason, SyncStatus } from '../shared/types.ts'
import type { DemoLang } from './demo.ts'
import type { NotionPage } from './notion.ts'
import type { SettingsService } from './settings.ts'
import type { JsonStore } from './storage.ts'
import { buildCards, collectAccountNames } from './cards.ts'
import { buildDemoCards } from './demo.ts'
import { AppError } from './errors.ts'
import { checkFields } from './fieldcheck.ts'
import { resolveKeepAliveCode, resolveRecordKind } from './mapping.ts'
import { NotionClient, NotionError } from './notion.ts'

const CACHE_FILE = 'cache.json'
const STATUS_FILE = 'sync-status.json'
const STALE_AFTER_MS = 25 * 60 * 60 * 1000
const MAX_TIMER_MS = 2 ** 31 - 1

interface CacheData {
  syncedAt: string
  cards: SimCard[]
}

function zonedParts(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const parts = Object.fromEntries(fmt.formatToParts(date).map(p => [p.type, p.value]))
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  }
}

function timezoneOffsetMs(date: Date, timeZone: string): number {
  const p = zonedParts(date, timeZone)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return asUtc - Math.floor(date.getTime() / 1000) * 1000
}

/** Computes the next occurrence of `HH:mm` in the given IANA timezone. */
export function computeNextRun(time: string, timeZone: string, now = new Date()): Date {
  const [hour, minute] = time.split(':').map(Number) as [number, number]
  const p = zonedParts(now, timeZone)
  for (let addDays = 0; addDays < 3; addDays++) {
    const wallClockAsUtc = Date.UTC(p.year, p.month - 1, p.day + addDays, hour, minute, 0)
    const candidate = new Date(wallClockAsUtc - timezoneOffsetMs(new Date(wallClockAsUtc), timeZone))
    if (candidate.getTime() > now.getTime() + 1000)
      return candidate
  }
  return new Date(now.getTime() + 24 * 60 * 60 * 1000)
}

interface ErrorInfo {
  code: string
  message: string
  params: ErrorParams
}

function errorInfo(error: unknown): ErrorInfo {
  if (error instanceof NotionError)
    return { code: error.appCode, message: error.message, params: error.params }
  if (error instanceof AppError)
    return { code: error.code, message: error.message, params: error.params }
  const message = error instanceof Error ? error.message : String(error)
  return { code: 'sync.failed', message, params: { message } }
}

export class SyncService {
  private store: JsonStore
  private settings: SettingsService
  private cache: CacheData | null
  private status: SyncStatus
  private running: Promise<void> | null = null
  private timer: ReturnType<typeof setTimeout> | null = null

  constructor(store: JsonStore, settings: SettingsService) {
    this.store = store
    this.settings = settings
    this.cache = store.read<CacheData | null>(CACHE_FILE, null)
    this.status = {
      running: false,
      lastStartedAt: null,
      lastFinishedAt: null,
      lastSuccessAt: null,
      lastError: null,
      lastErrorCode: null,
      lastErrorParams: null,
      lastWarning: null,
      lastWarningCode: null,
      lastWarningParams: null,
      lastReason: null,
      cardCount: this.cache?.cards.length ?? 0,
      recordCount: 0,
      nextRunAt: null,
      fieldIssues: null,
      ...store.read<Partial<SyncStatus>>(STATUS_FILE, {}),
    }
    this.status.running = false
    this.backfillCache()
  }

  /** Caches written by older versions get record kinds (v0.2) and keep-alive codes (v0.3) derived locally until the next sync. */
  private backfillCache(): void {
    if (!this.cache)
      return
    const mapping = this.settings.notion.mapping
    for (const card of this.cache.cards) {
      if (!Array.isArray(card.keepAliveCodes))
        card.keepAliveCodes = card.keepAlive.map(label => resolveKeepAliveCode(label, mapping))
      for (const record of card.history) {
        if (!record.kind)
          record.kind = resolveRecordKind(record.type, mapping)
      }
    }
  }

  isDemo(): boolean {
    return !this.settings.notion.token
  }

  /** `lang` only affects demo data; synced cards are always in the language of the Notion template */
  getCards(lang: DemoLang = 'zh'): { cards: SimCard[], syncedAt: string | null, demo: boolean } {
    if (this.isDemo())
      return { cards: buildDemoCards(lang), syncedAt: null, demo: true }
    return { cards: this.cache?.cards ?? [], syncedAt: this.cache?.syncedAt ?? null, demo: false }
  }

  getStatus(): SyncStatus {
    return { ...this.status, running: this.running !== null }
  }

  private saveStatus(): void {
    const { running: _running, ...rest } = this.status
    this.store.write(STATUS_FILE, rest)
  }

  start(): void {
    this.schedule()
    const syncedAt = this.cache?.syncedAt ? new Date(this.cache.syncedAt).getTime() : 0
    if (!this.isDemo() && Date.now() - syncedAt > STALE_AFTER_MS) {
      setTimeout(() => {
        this.run('startup').catch(() => {})
      }, 3000)
    }
  }

  schedule(): void {
    if (this.timer)
      clearTimeout(this.timer)
    const next = computeNextRun(this.settings.syncTime, this.settings.timezone)
    this.status.nextRunAt = next.toISOString()
    const delay = Math.min(next.getTime() - Date.now(), MAX_TIMER_MS)
    this.timer = setTimeout(() => {
      this.timer = null
      if (Date.now() < next.getTime() - 1000) {
        this.schedule()
        return
      }
      this.run('daily').catch(() => {}).finally(() => this.schedule())
    }, delay)
    this.timer.unref?.()
  }

  stop(): void {
    if (this.timer)
      clearTimeout(this.timer)
    this.timer = null
  }

  run(reason: SyncReason): Promise<void> {
    if (this.running)
      return this.running
    this.running = this.doRun(reason).finally(() => {
      this.running = null
    })
    return this.running
  }

  private async doRun(reason: SyncReason): Promise<void> {
    const conn = this.settings.notion
    this.status.lastStartedAt = new Date().toISOString()
    this.status.lastReason = reason
    this.status.fieldIssues = null
    console.log(`[sync] Starting sync (${reason})`)

    try {
      if (!conn.token)
        throw new AppError(400, 'sync.noToken', 'Notion token is not configured')
      if (!conn.cardsDb || !conn.recordsDb)
        throw new AppError(400, 'sync.noDatabases', 'SIM card and expense record database IDs are not set')

      const client = new NotionClient(conn.token)
      const cardsSource = await client.resolveDataSource(conn.cardsDb)
      const recordsSource = await client.resolveDataSource(conn.recordsDb)
      const fieldIssues: FieldIssue[] = [
        ...checkFields('cards', cardsSource.properties ?? {}, conn.mapping),
        ...checkFields('records', recordsSource.properties ?? {}, conn.mapping),
      ]
      this.status.fieldIssues = fieldIssues
      if (fieldIssues.length)
        console.warn(`[sync] ${fieldIssues.length} mapped column(s) missing or of an unexpected type`)
      // Payment accounts are only used to resolve display names; skip on failure without failing the sync
      let accountPages: NotionPage[] = []
      let warning: ErrorInfo | null = null
      if (conn.accountsDb) {
        try {
          accountPages = await client.queryAll((await client.resolveDataSource(conn.accountsDb)).id)
        }
        catch (error) {
          // `cause` is itself a code; the UI translates it with the same params
          const cause = errorInfo(error)
          warning = {
            code: 'sync.accountsSkipped',
            message: `Skipped the payment accounts database (account names will not show): ${cause.message}`,
            params: { ...cause.params, cause: cause.code },
          }
          console.warn(`[sync] ${warning.message}`)
        }
      }
      const cardPages = await client.queryAll(cardsSource.id)
      const recordPages = await client.queryAll(recordsSource.id)

      const { cards, recordCount } = buildCards(cardPages, recordPages, conn.mapping, collectAccountNames(accountPages), this.settings.idKey)
      const syncedAt = new Date().toISOString()
      this.cache = { syncedAt, cards }
      this.store.write(CACHE_FILE, this.cache)

      this.status.lastSuccessAt = syncedAt
      this.status.lastError = null
      this.status.lastErrorCode = null
      this.status.lastErrorParams = null
      this.status.lastWarning = warning?.message ?? null
      this.status.lastWarningCode = warning?.code ?? null
      this.status.lastWarningParams = warning?.params ?? null
      this.status.cardCount = cards.length
      this.status.recordCount = recordCount
      console.log(`[sync] Sync complete: ${cards.length} cards, ${recordCount} records`)
    }
    catch (error) {
      const info = errorInfo(error)
      this.status.lastError = info.message
      this.status.lastErrorCode = info.code
      this.status.lastErrorParams = info.params
      console.error(`[sync] Sync failed: ${info.message}`)
      throw error
    }
    finally {
      this.status.lastFinishedAt = new Date().toISOString()
      this.saveStatus()
    }
  }
}
