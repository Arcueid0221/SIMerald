import type { SimCard, SyncStatus } from '../shared/types.ts'
import type { NotionPage } from './notion.ts'
import type { SettingsService } from './settings.ts'
import type { JsonStore } from './storage.ts'
import { buildCards, collectAccountNames } from './cards.ts'
import { buildDemoCards } from './demo.ts'
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

/** 计算下一次在指定时区的 HH:mm 执行的时间点 */
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
      lastWarning: null,
      lastReason: null,
      cardCount: this.cache?.cards.length ?? 0,
      recordCount: 0,
      nextRunAt: null,
      ...store.read<Partial<SyncStatus>>(STATUS_FILE, {}),
    }
    this.status.running = false
  }

  isDemo(): boolean {
    return !this.settings.notion.token
  }

  getCards(): { cards: SimCard[], syncedAt: string | null, demo: boolean } {
    if (this.isDemo())
      return { cards: buildDemoCards(), syncedAt: null, demo: true }
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
        this.run('启动时数据已过期').catch(() => {})
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
      this.run('每日定时同步').catch(() => {}).finally(() => this.schedule())
    }, delay)
    this.timer.unref?.()
  }

  stop(): void {
    if (this.timer)
      clearTimeout(this.timer)
    this.timer = null
  }

  run(reason: string): Promise<void> {
    if (this.running)
      return this.running
    this.running = this.doRun(reason).finally(() => {
      this.running = null
    })
    return this.running
  }

  private async doRun(reason: string): Promise<void> {
    const conn = this.settings.notion
    this.status.lastStartedAt = new Date().toISOString()
    this.status.lastReason = reason
    console.log(`[sync] 开始同步（${reason}）`)

    try {
      if (!conn.token)
        throw new Error('还没有配置 Notion token')
      if (!conn.cardsDb || !conn.recordsDb)
        throw new Error('还没有填写 SIM 卡数据库和消费记录数据库的 ID')

      const client = new NotionClient(conn.token)
      const cardsSource = await client.resolveDataSource(conn.cardsDb)
      const recordsSource = await client.resolveDataSource(conn.recordsDb)
      // 扣款账户只用来显示名称，读不到时跳过，不影响其他数据
      let accountPages: NotionPage[] = []
      let warning: string | null = null
      if (conn.accountsDb) {
        try {
          accountPages = await client.queryAll(await client.resolveDataSource(conn.accountsDb))
        }
        catch (error) {
          warning = `扣款账户数据库读取失败，已跳过（扣款账户名称不会显示）：${(error as Error).message}`
          console.warn(`[sync] ${warning}`)
        }
      }
      const cardPages = await client.queryAll(cardsSource)
      const recordPages = await client.queryAll(recordsSource)

      const { cards, recordCount } = buildCards(cardPages, recordPages, conn.mapping, collectAccountNames(accountPages))
      const syncedAt = new Date().toISOString()
      this.cache = { syncedAt, cards }
      this.store.write(CACHE_FILE, this.cache)

      this.status.lastSuccessAt = syncedAt
      this.status.lastError = null
      this.status.lastWarning = warning
      this.status.cardCount = cards.length
      this.status.recordCount = recordCount
      console.log(`[sync] 同步完成：${cards.length} 张卡，${recordCount} 条消费记录`)
    }
    catch (error) {
      const message = error instanceof NotionError || error instanceof Error ? error.message : String(error)
      this.status.lastError = message
      console.error(`[sync] 同步失败：${message}`)
      throw error
    }
    finally {
      this.status.lastFinishedAt = new Date().toISOString()
      this.saveStatus()
    }
  }
}
