import type { SettingValue } from '../shared/settings-schema.ts'
import type { AppConfig } from './config.ts'
import type { FieldMapping } from './mapping.ts'
import type { JsonStore } from './storage.ts'
import { randomBytes } from 'node:crypto'
import { getDefaultSettings, sanitizeSettings } from '../shared/settings-schema.ts'
import { DEFAULT_MAPPING, parseMappingText } from './mapping.ts'
import { normalizeNotionId } from './notion.ts'

const SETTINGS_FILE = 'settings.json'
const SECRETS_FILE = 'secrets.json'
const TIME_REGEX = /^(?:[01]\d|2[0-3]):[0-5]\d$/

interface StoredSettings {
  theme: Record<string, SettingValue>
  syncTime: string
  timezone: string
  notion: {
    cardsDb: string
    recordsDb: string
    accountsDb: string
    mapping: string
  }
}

interface StoredSecrets {
  notionToken: string | null
  /** Secret key for deriving public card IDs, generated automatically on first boot */
  idKey?: string
}

export interface NotionConnection {
  token: string | null
  tokenFromEnv: boolean
  cardsDb: string | null
  recordsDb: string | null
  accountsDb: string | null
  mapping: FieldMapping
}

export function isValidTimezone(tz: string): boolean {
  try {
    return Boolean(new Intl.DateTimeFormat('en-US', { timeZone: tz }).resolvedOptions().timeZone)
  }
  catch {
    return false
  }
}

export class SettingsService {
  private store: JsonStore
  private config: AppConfig
  private data: StoredSettings
  private secrets: StoredSecrets

  constructor(store: JsonStore, config: AppConfig) {
    this.store = store
    this.config = config
    const raw = store.read<Partial<StoredSettings>>(SETTINGS_FILE, {})
    this.data = {
      theme: sanitizeSettings(raw.theme ?? getDefaultSettings()),
      syncTime: typeof raw.syncTime === 'string' && TIME_REGEX.test(raw.syncTime) ? raw.syncTime : '05:00',
      timezone: typeof raw.timezone === 'string' && isValidTimezone(raw.timezone) ? raw.timezone : 'Asia/Shanghai',
      notion: {
        cardsDb: raw.notion?.cardsDb ?? '',
        recordsDb: raw.notion?.recordsDb ?? '',
        accountsDb: raw.notion?.accountsDb ?? '',
        mapping: raw.notion?.mapping ?? '',
      },
    }
    this.secrets = store.read<StoredSecrets>(SECRETS_FILE, { notionToken: null })
    if (!this.secrets.idKey) {
      this.secrets.idKey = randomBytes(32).toString('base64url')
      this.store.write(SECRETS_FILE, this.secrets)
    }
  }

  private save(): void {
    this.store.write(SETTINGS_FILE, this.data)
  }

  get theme(): Record<string, SettingValue> {
    return this.data.theme
  }

  get syncTime(): string {
    return this.data.syncTime
  }

  get timezone(): string {
    return this.data.timezone
  }

  get idKey(): string {
    return this.secrets.idKey!
  }

  get sitename(): string {
    const name = this.data.theme.sitename
    return typeof name === 'string' && name.trim() ? name.trim() : 'SIMerald'
  }

  updateTheme(input: unknown): Record<string, SettingValue> {
    this.data.theme = sanitizeSettings(input)
    this.save()
    return this.data.theme
  }

  updateSchedule(syncTime: unknown, timezone: unknown): void {
    if (typeof syncTime !== 'string' || !TIME_REGEX.test(syncTime))
      throw new Error('同步时间格式应为 HH:mm，例如 05:00')
    if (typeof timezone !== 'string' || !isValidTimezone(timezone))
      throw new Error('时区无效，例如 Asia/Shanghai')
    this.data.syncTime = syncTime
    this.data.timezone = timezone
    this.save()
  }

  /** Effective Notion connection config: settings panel values take precedence over environment variables */
  get notion(): NotionConnection {
    const pick = (saved: string, fallback: string | null) => normalizeNotionId(saved) ?? (fallback ? normalizeNotionId(fallback) : null)
    let mapping = DEFAULT_MAPPING
    try {
      mapping = parseMappingText(this.data.notion.mapping)
    }
    catch {
      // Validated on save; fallback only
    }
    return {
      token: this.config.envNotionToken ?? this.secrets.notionToken,
      tokenFromEnv: !!this.config.envNotionToken,
      cardsDb: pick(this.data.notion.cardsDb, this.config.envCardsDb),
      recordsDb: pick(this.data.notion.recordsDb, this.config.envRecordsDb),
      accountsDb: pick(this.data.notion.accountsDb, this.config.envAccountsDb),
      mapping,
    }
  }

  get notionForm(): { cardsDb: string, recordsDb: string, accountsDb: string, mapping: string } {
    const effective = this.notion
    return {
      cardsDb: effective.cardsDb ?? '',
      recordsDb: effective.recordsDb ?? '',
      accountsDb: effective.accountsDb ?? '',
      mapping: this.data.notion.mapping || JSON.stringify(DEFAULT_MAPPING, null, 2),
    }
  }

  updateNotion(input: { token?: unknown, clearToken?: unknown, cardsDb?: unknown, recordsDb?: unknown, accountsDb?: unknown, mapping?: unknown }): void {
    const ids: Record<'cardsDb' | 'recordsDb' | 'accountsDb', string> = { cardsDb: '', recordsDb: '', accountsDb: '' }
    for (const key of ['cardsDb', 'recordsDb', 'accountsDb'] as const) {
      const value = input[key]
      if (typeof value !== 'string' || !value.trim())
        continue
      const id = normalizeNotionId(value)
      if (!id)
        throw new Error(`数据库 ID 格式不对：${value}`)
      ids[key] = id
    }

    let mappingText = ''
    if (typeof input.mapping === 'string' && input.mapping.trim()) {
      try {
        parseMappingText(input.mapping)
      }
      catch {
        throw new Error('字段映射不是合法的 JSON')
      }
      // Omit when identical to the default so future default updates take effect automatically
      const normalized = JSON.stringify(JSON.parse(input.mapping))
      mappingText = normalized === JSON.stringify(DEFAULT_MAPPING) ? '' : input.mapping
    }

    const newToken = typeof input.token === 'string' ? input.token.trim() : ''
    if (newToken && (newToken.length < 20 || newToken.length > 200))
      throw new Error('Notion token 格式不对')

    this.data.notion = { ...ids, mapping: mappingText }
    this.save()

    if (input.clearToken === true) {
      this.secrets.notionToken = null
      this.store.write(SECRETS_FILE, this.secrets)
    }
    else if (newToken) {
      this.secrets.notionToken = newToken
      this.store.write(SECRETS_FILE, this.secrets)
    }
  }
}
