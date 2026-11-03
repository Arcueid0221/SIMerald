import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Small JSON file store in the data directory.
 * Writes atomically via a temp file + rename to prevent corruption on crash, with 0600 permissions.
 */
export class JsonStore {
  private dir: string

  constructor(dir: string) {
    this.dir = dir
    mkdirSync(dir, { recursive: true, mode: 0o700 })
  }

  path(name: string): string {
    return path.join(this.dir, name)
  }

  read<T>(name: string, fallback: T): T {
    const file = this.path(name)
    if (!existsSync(file))
      return fallback
    try {
      return JSON.parse(readFileSync(file, 'utf-8')) as T
    }
    catch (error) {
      console.error(`[storage] Failed to read ${name}, using default:`, error)
      return fallback
    }
  }

  write(name: string, data: unknown): void {
    const file = this.path(name)
    const tmp = `${file}.${process.pid}.tmp`
    writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600 })
    renameSync(tmp, file)
    chmodSync(file, 0o600)
  }

  writeText(name: string, text: string): void {
    const file = this.path(name)
    writeFileSync(file, text, { mode: 0o600 })
  }
}
