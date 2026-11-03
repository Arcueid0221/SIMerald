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

/** 从哪里取访客的真实 IP（登录失败按 IP 锁定要用） */
export type TrustProxy = 'none' | 'cloudflare' | 'xff'

const TRUST_PROXY_VALUES: TrustProxy[] = ['none', 'cloudflare', 'xff']

function readTrustProxy(): TrustProxy {
  const value = env('TRUST_PROXY')?.toLowerCase() ?? 'none'
  if ((TRUST_PROXY_VALUES as string[]).includes(value))
    return value as TrustProxy
  console.warn(`[config] TRUST_PROXY=${value} 无法识别，按 none 处理（可选值：${TRUST_PROXY_VALUES.join(' / ')}）`)
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
   * none：直接用连接的来源地址；cloudflare：用 CF-Connecting-IP；xff：用 X-Forwarded-For 的最后一个地址。
   * 只有确定请求都经过对应的代理时才能打开，否则别人可以伪造请求头绕过按 IP 锁定
   */
  trustProxy: TrustProxy
  /** 来自环境变量的 Notion token；为空时可以在设置面板里填写 */
  envNotionToken: string | null
  /** 环境变量里的默认数据库 ID，设置面板没填时使用 */
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
