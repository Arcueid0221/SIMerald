import type { Env } from './env.ts'

/**
 * Lists objects in the notes bucket by folder. Keys are compared after URL-decoding, because some
 * uploaders store `卡片/a b.md` as `%E5%8D%A1%E7%89%87/a%20b.md` (wrangler's local `r2 object put` does).
 */

export interface BucketFile {
  /** Key as stored, for reading the object */
  key: string
  /** Decoded path relative to the folder, e.g. `Harbour Mobile 0456.md` */
  path: string
  etag: string
}

const EDGE_SLASHES_REGEX = /^\/+|\/+$/g

function decodeKey(key: string): string {
  try {
    return decodeURIComponent(key)
  }
  catch {
    return key
  }
}

export function folderPrefix(folder: string): string {
  const trimmed = folder.replace(EDGE_SLASHES_REGEX, '')
  return trimmed ? `${trimmed}/` : ''
}

/** Every object under `folder` (including subfolders) */
export async function listFolder(env: Env, folder: string): Promise<BucketFile[]> {
  const prefix = folderPrefix(folder)
  const files: BucketFile[] = []
  let cursor: string | undefined
  do {
    // The whole bucket is listed: an encoded key does not share the plain prefix. A vault is small.
    const page = await env.NOTES.list({ cursor })
    for (const object of page.objects) {
      const decoded = decodeKey(object.key)
      if (decoded.startsWith(prefix))
        files.push({ key: object.key, path: decoded.slice(prefix.length), etag: object.etag })
    }
    cursor = page.truncated ? page.cursor : undefined
  } while (cursor)
  return files
}

/** Reads one file from `folder` by its decoded name */
export async function getFile(env: Env, folder: string, name: string): Promise<R2ObjectBody | null> {
  const plain = folderPrefix(folder) + name
  const direct = await env.NOTES.get(plain)
  if (direct)
    return direct
  const encoded = plain.split('/').map(encodeURIComponent).join('/')
  return encoded === plain ? null : env.NOTES.get(encoded)
}
