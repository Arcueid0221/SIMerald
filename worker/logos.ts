import type { Env } from './env.ts'
import { getFile, listFolder } from './bucket.ts'

/**
 * Carrier logos in the vault's logos folder, named after the carrier. Matching ignores case, whitespace and
 * punctuation, so both `Harbour Mobile.png` and `harbour-mobile.webp` match "Harbour Mobile".
 * The list is read during sync and kept in the snapshot; files are served from R2 at /logos/<file>.
 */

export const LOGO_TYPES: Record<string, string> = {
  png: 'image/png',
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  svg: 'image/svg+xml',
}

const IGNORED_CHARS_REGEX = /[\s\p{P}\p{S}]+/gu

export function logoKey(name: string): string {
  return name.normalize('NFKC').toLowerCase().replace(IGNORED_CHARS_REGEX, '')
}

function extension(file: string): string {
  const dot = file.lastIndexOf('.')
  return dot === -1 ? '' : file.slice(dot + 1).toLowerCase()
}

/** Lists logo files; returns carrier key → URL (with a version so the URL changes when the file does) */
export async function listLogos(env: Env, folder: string): Promise<Record<string, string>> {
  const urls: Record<string, string> = {}
  for (const file of await listFolder(env, folder)) {
    if (file.path.includes('/') || !LOGO_TYPES[extension(file.path)])
      continue
    const key = logoKey(file.path.slice(0, file.path.lastIndexOf('.')))
    if (key && !urls[key])
      urls[key] = `/logos/${encodeURIComponent(file.path)}?v=${file.etag.slice(0, 8)}`
  }
  return urls
}

/** Serves `GET /logos/<file>` from the bucket; null when there is no such logo */
export async function serveLogo(env: Env, folder: string, pathname: string): Promise<Response | null> {
  let file: string
  try {
    file = decodeURIComponent(pathname.slice('/logos/'.length))
  }
  catch {
    return null
  }
  const type = LOGO_TYPES[extension(file)]
  if (!type || !file || file.includes('/') || file.includes('..'))
    return null
  const object = await getFile(env, folder, file)
  if (!object)
    return null
  const headers = new Headers({
    'Content-Type': type,
    // URLs carry the file's etag as `?v=`, so responses can be cached for good
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
  })
  // SVGs are opened as images only; block scripts if someone opens one directly
  if (type === 'image/svg+xml')
    headers.set('Content-Security-Policy', 'default-src \'none\'; style-src \'unsafe-inline\'; sandbox')
  return new Response(object.body, { headers })
}
