import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'

/**
 * 数据目录里的小 JSON 文件读写。
 * 写入时先写临时文件再改名，避免写到一半断电导致文件损坏；权限设为只有 root 能读写。
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
      console.error(`[storage] ${name} 读取失败，使用默认值:`, error)
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
