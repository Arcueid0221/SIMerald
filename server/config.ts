import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function readPackageVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(path.join(rootDir, 'package.json'), 'utf-8')) as { version?: string }
    return pkg.version ?? '0.0.0'
  }
  catch {
    return '0.0.0'
  }
}

function env(name: string): string | undefined {
  const value = process.env[name]?.trim()
  return value || undefined
}

/** Source of the client IP used for per-IP login rate limiting */
export type TrustProxy = 'none' | 'cloudflare' | 'xff'

const TRUST_PROXY_VALUES: TrustProxy[] = ['none', 'cloudflare', 'xff']

function readTrustProxy(): TrustProxy {
  const value = env('TRUST_PROXY')?.toLowerCase() ?? 'none'
  if ((TRUST_PROXY_VALUES as string[]).includes(value))
    return value as TrustProxy
  console.warn(`[config] Unrecognized TRUST_PROXY=${value}, falling back to none (valid values: ${TRUST_PROXY_VALUES.join(' / ')})`)
  return 'none'
}

export interface AppConfig {
  port: number
  host: string
  dataDir: string
  staticDir: string
  version: string
  gitHash: string
  /**
   * none: socket remote address; cloudflare: CF-Connecting-IP; xff: last X-Forwarded-For entry.
   * Enable only behind the corresponding reverse proxy, or clients can spoof headers to bypass IP lockouts.
   */
  trustProxy: TrustProxy
  /** Notion token from environment; can be configured in the settings panel if unset */
  envNotionToken: string | null
  /** Default Notion database IDs from environment, used when not set in the settings panel */
  envCardsDb: string | null
  envRecordsDb: string | null
  envAccountsDb: string | null
}

export function loadConfig(): AppConfig {
  const staticCandidates = [env('STATIC_DIR'), path.join(rootDir, 'dist')].filter(Boolean) as string[]
  const staticDir = staticCandidates.find(dir => existsSync(dir)) ?? staticCandidates[0]!

  return {
    port: Number(env('PORT') ?? 25780),
    host: env('HOST') ?? '0.0.0.0',
    dataDir: path.resolve(env('DATA_DIR') ?? path.join(rootDir, 'data')),
    staticDir,
    version: readPackageVersion(),
    gitHash: env('GIT_HASH') ?? 'dev',
    trustProxy: readTrustProxy(),
    envNotionToken: env('NOTION_TOKEN') ?? null,
    envCardsDb: env('NOTION_CARDS_DB') ?? null,
    envRecordsDb: env('NOTION_RECORDS_DB') ?? null,
    envAccountsDb: env('NOTION_ACCOUNTS_DB') ?? null,
  }
}
