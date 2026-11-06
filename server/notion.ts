/**
 * Minimal read-only client for the official Notion API.
 * Uses API version 2025-09-03, where databases contain data sources queried via /v1/data_sources/{id}/query.
 */

const NOTION_API = 'https://api.notion.com/v1'
const NOTION_VERSION = '2025-09-03'
const MIN_INTERVAL_MS = 350
const REQUEST_TIMEOUT_MS = 20_000
const MAX_RETRIES = 4
const HEX32_REGEX = /[0-9a-f]{32}/i
const DASHES_REGEX = /-/g

export class NotionError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export interface NotionSelect {
  name: string
  color: string
}

export interface NotionDate {
  start: string
  end: string | null
}

/** Raw Notion page property value, declaring only the fields we use. */
export interface NotionPropertyValue {
  type: string
  title?: Array<{ plain_text: string }>
  rich_text?: Array<{ plain_text: string }>
  number?: number | null
  select?: NotionSelect | null
  status?: NotionSelect | null
  multi_select?: NotionSelect[]
  date?: NotionDate | null
  phone_number?: string | null
  email?: string | null
  url?: string | null
  checkbox?: boolean
  relation?: Array<{ id: string }>
  formula?: {
    type: 'string' | 'number' | 'boolean' | 'date'
    string?: string | null
    number?: number | null
    boolean?: boolean | null
    date?: NotionDate | null
  }
  rollup?: {
    type: 'number' | 'date' | 'array' | 'unsupported' | 'incomplete'
    number?: number | null
    date?: NotionDate | null
    array?: NotionPropertyValue[]
  }
  created_time?: string
  last_edited_time?: string
}

export interface NotionPage {
  id: string
  url: string
  created_time: string
  in_trash?: boolean
  archived?: boolean
  properties: Record<string, NotionPropertyValue>
}

/** Property schema entry of a data source, declaring only the fields we use. */
export interface NotionPropertySchema {
  id: string
  name: string
  type: string
  relation?: { data_source_id?: string, database_id?: string }
}

export interface NotionDataSource {
  object: string
  id: string
  title?: Array<{ plain_text: string }>
  in_trash?: boolean
  archived?: boolean
  parent?: { type: string, database_id?: string }
  properties?: Record<string, NotionPropertySchema>
}

export function dataSourceTitle(source: NotionDataSource): string {
  return (source.title ?? []).map(t => t.plain_text).join('').trim()
}

/** Normalizes a Notion URL or dashed/undashed ID into a dashed UUID. */
export function normalizeNotionId(input: string): string | null {
  const match = input.replace(DASHES_REGEX, '').match(HEX32_REGEX)
  if (!match)
    return null
  const hex = match[0].toLowerCase()
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function describeError(status: number, code: string, message: string): string {
  if (status === 401)
    return 'Notion token 无效或已被撤销'
  if (status === 403)
    return 'Notion integration 没有读取权限'
  if (status === 404 || code === 'object_not_found')
    return '找不到数据库：ID 不对，或者没有把页面共享给这个 integration'
  if (status === 429)
    return 'Notion 请求太频繁，请稍后再试'
  return `Notion 接口出错（${status} ${code}）：${message}`
}

export class NotionClient {
  private token: string
  private lastRequestAt = 0

  constructor(token: string) {
    this.token = token
  }

  private async request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    let attempt = 0
    while (true) {
      const wait = this.lastRequestAt + MIN_INTERVAL_MS - Date.now()
      if (wait > 0)
        await sleep(wait)
      this.lastRequestAt = Date.now()

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
      let response: Response
      try {
        response = await fetch(`${NOTION_API}${path}`, {
          method,
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Notion-Version': NOTION_VERSION,
            'Content-Type': 'application/json',
          },
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: controller.signal,
        })
      }
      catch (error) {
        clearTimeout(timer)
        if (attempt++ < MAX_RETRIES) {
          await sleep(1000 * attempt)
          continue
        }
        throw new NotionError(0, 'network_error', `连不上 Notion：${(error as Error).message}`)
      }
      clearTimeout(timer)

      if (response.ok)
        return await response.json() as T

      const payload = await response.json().catch(() => ({})) as { code?: string, message?: string }
      const retryable = response.status === 429 || response.status >= 500
      if (retryable && attempt++ < MAX_RETRIES) {
        const retryAfter = Number(response.headers.get('retry-after'))
        await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1000 * 2 ** attempt)
        continue
      }
      const code = payload.code ?? 'unknown'
      throw new NotionError(response.status, code, describeError(response.status, code, payload.message ?? ''))
    }
  }

  /** Accepts a data source ID or database ID and returns the data source, including its property schema. */
  async resolveDataSource(id: string): Promise<NotionDataSource> {
    try {
      return await this.getDataSource(id)
    }
    catch (error) {
      if (!(error instanceof NotionError) || (error.status !== 404 && error.status !== 400))
        throw error
    }
    const db = await this.request<{ data_sources?: Array<{ id: string }> }>('GET', `/databases/${id}`)
    const first = db.data_sources?.[0]?.id
    if (!first)
      throw new NotionError(404, 'object_not_found', '这个数据库里没有数据源')
    return await this.getDataSource(first)
  }

  /** Fetches a data source with its property schema. */
  async getDataSource(dataSourceId: string): Promise<NotionDataSource> {
    return await this.request<NotionDataSource>('GET', `/data_sources/${dataSourceId}`)
  }

  /** Lists every data source shared with the integration (capped at `maxPages` × 100 results). */
  async searchDataSources(maxPages = 5): Promise<NotionDataSource[]> {
    const sources: NotionDataSource[] = []
    let cursor: string | undefined
    let pages = 0
    do {
      const result = await this.request<{ results: NotionDataSource[], has_more: boolean, next_cursor: string | null }>(
        'POST',
        '/search',
        {
          filter: { property: 'object', value: 'data_source' },
          page_size: 100,
          start_cursor: cursor,
        },
      )
      sources.push(...result.results.filter(s => s.object === 'data_source' && !s.in_trash && !s.archived))
      cursor = result.has_more ? (result.next_cursor ?? undefined) : undefined
      pages++
    } while (cursor && pages < maxPages)
    return sources
  }

  async queryAll(dataSourceId: string): Promise<NotionPage[]> {
    const pages: NotionPage[] = []
    let cursor: string | undefined
    do {
      const result = await this.request<{ results: NotionPage[], has_more: boolean, next_cursor: string | null }>(
        'POST',
        `/data_sources/${dataSourceId}/query`,
        {
          page_size: 100,
          start_cursor: cursor,
          sorts: [{ timestamp: 'created_time', direction: 'ascending' }],
        },
      )
      pages.push(...result.results.filter(p => !p.in_trash && !p.archived))
      cursor = result.has_more ? (result.next_cursor ?? undefined) : undefined
    } while (cursor)
    return pages
  }
}

// ===== Property extractors =====

function plain(list: Array<{ plain_text: string }> | undefined): string {
  return (list ?? []).map(t => t.plain_text).join('').trim()
}

export function propText(prop: NotionPropertyValue | undefined): string | null {
  if (!prop)
    return null
  switch (prop.type) {
    case 'title': return plain(prop.title) || null
    case 'rich_text': return plain(prop.rich_text) || null
    case 'select': return prop.select?.name ?? null
    case 'status': return prop.status?.name ?? null
    case 'phone_number': return prop.phone_number ?? null
    case 'email': return prop.email ?? null
    case 'url': return prop.url ?? null
    case 'number': return prop.number === null || prop.number === undefined ? null : String(prop.number)
    case 'formula': {
      const f = prop.formula
      if (!f)
        return null
      if (f.type === 'string')
        return f.string?.trim() || null
      if (f.type === 'number')
        return f.number === null || f.number === undefined ? null : String(f.number)
      if (f.type === 'boolean')
        return f.boolean === null || f.boolean === undefined ? null : String(f.boolean)
      if (f.type === 'date')
        return f.date?.start ?? null
      return null
    }
    case 'rollup': {
      const r = prop.rollup
      if (!r)
        return null
      if (r.type === 'number')
        return r.number === null || r.number === undefined ? null : String(r.number)
      if (r.type === 'date')
        return r.date?.start ?? null
      if (r.type === 'array')
        return (r.array ?? []).map(propText).filter(Boolean).join(', ') || null
      return null
    }
    case 'multi_select': return (prop.multi_select ?? []).map(s => s.name).join(', ') || null
    default: return null
  }
}

export function propNumber(prop: NotionPropertyValue | undefined): number | null {
  if (!prop)
    return null
  let value: number | null | undefined
  if (prop.type === 'number') {
    value = prop.number
  }
  else if (prop.type === 'formula' && prop.formula?.type === 'number') {
    value = prop.formula.number
  }
  else if (prop.type === 'rollup' && prop.rollup?.type === 'number') {
    value = prop.rollup.number
  }
  else {
    const text = propText(prop)
    value = text === null ? null : Number(text)
  }
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function propDate(prop: NotionPropertyValue | undefined): NotionDate | null {
  if (!prop)
    return null
  if (prop.type === 'date')
    return prop.date ?? null
  if (prop.type === 'formula' && prop.formula?.type === 'date')
    return prop.formula.date ?? null
  if (prop.type === 'rollup') {
    if (prop.rollup?.type === 'date')
      return prop.rollup.date ?? null
    if (prop.rollup?.type === 'array') {
      const dates = (prop.rollup.array ?? []).map(propDate).filter(Boolean) as NotionDate[]
      return dates.sort((a, b) => a.start.localeCompare(b.start))[0] ?? null
    }
  }
  if (prop.type === 'created_time' && prop.created_time)
    return { start: prop.created_time, end: null }
  if (prop.type === 'formula' && prop.formula?.type === 'string' && prop.formula.string) {
    const s = prop.formula.string.trim()
    return s ? { start: s, end: null } : null
  }
  return null
}

export function propSelect(prop: NotionPropertyValue | undefined): NotionSelect | null {
  if (!prop)
    return null
  if (prop.type === 'select')
    return prop.select ?? null
  if (prop.type === 'status')
    return prop.status ?? null
  const text = propText(prop)
  return text ? { name: text, color: 'default' } : null
}

export function propList(prop: NotionPropertyValue | undefined): string[] {
  if (!prop)
    return []
  if (prop.type === 'multi_select')
    return (prop.multi_select ?? []).map(s => s.name)
  if (prop.type === 'rollup' && prop.rollup?.type === 'array')
    return (prop.rollup.array ?? []).map(propText).filter(Boolean) as string[]
  const text = propText(prop)
  return text ? [text] : []
}

export function propRelation(prop: NotionPropertyValue | undefined): string[] {
  if (!prop || prop.type !== 'relation')
    return []
  return (prop.relation ?? []).map(r => r.id)
}

export function findTitleProperty(page: NotionPage): NotionPropertyValue | undefined {
  return Object.values(page.properties).find(p => p.type === 'title')
}
