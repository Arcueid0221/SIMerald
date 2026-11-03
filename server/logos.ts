import type { IncomingMessage, ServerResponse } from 'node:http'
import { createReadStream, existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

/**
 * Carrier logos stored under `<dataDir>/logos/`, named after the carrier.
 * Matching ignores case, whitespace, and punctuation, so both `Harbour Mobile.png`
 * and `harbour-mobile.webp` match "Harbour Mobile".
 */

const LOGO_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
}

/** Directory listing cache TTL (1 minute); replaced logo files take up to 1 minute to take effect. */
const LIST_CACHE_MS = 60 * 1000
const IGNORED_CHARS_REGEX = /[\s\p{P}\p{S}]+/gu

export function logoKey(name: string): string {
  return name.normalize('NFKC').toLowerCase().replace(IGNORED_CHARS_REGEX, '')
}

export class LogoStore {
  dir: string
  cache: { at: number, urls: Map<string, string> } | null = null

  constructor(dataDir: string) {
    this.dir = path.join(dataDir, 'logos')
  }

  listUrls(): Map<string, string> {
    if (this.cache && Date.now() - this.cache.at < LIST_CACHE_MS)
      return this.cache.urls
    const urls = new Map<string, string>()
    if (existsSync(this.dir)) {
      for (const file of readdirSync(this.dir)) {
        const ext = path.extname(file).toLowerCase()
        if (!LOGO_TYPES[ext])
          continue
        const key = logoKey(path.basename(file, path.extname(file)))
        if (!key || urls.has(key))
          continue
        const version = Math.round(statSync(path.join(this.dir, file)).mtimeMs).toString(36)
        urls.set(key, `/logos/${encodeURIComponent(file)}?v=${version}`)
      }
    }
    this.cache = { at: Date.now(), urls }
    return urls
  }

  urlFor(carrier: string): string | null {
    return this.listUrls().get(logoKey(carrier)) ?? null
  }

  /** Serves `GET /logos/<filename>`; returns false if the file does not exist. */
  serve(req: IncomingMessage, res: ServerResponse, pathname: string, headers: Record<string, string>): boolean {
    let name: string
    try {
      name = decodeURIComponent(pathname.slice('/logos/'.length))
    }
    catch {
      return false
    }
    const type = LOGO_TYPES[path.extname(name).toLowerCase()]
    const filePath = path.resolve(this.dir, name)
    if (!type || path.dirname(filePath) !== path.resolve(this.dir) || !existsSync(filePath) || !statSync(filePath).isFile())
      return false
    res.writeHead(200, {
      ...headers,
      'Content-Type': type,
      // URLs include file mtime as `?v=`, so responses can be cached immutably
      'Cache-Control': 'public, max-age=31536000, immutable',
    })
    if (req.method === 'HEAD')
      res.end()
    else
      createReadStream(filePath).pipe(res)
    return true
  }
}
