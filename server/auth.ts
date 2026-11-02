import type { JsonStore } from './storage.ts'
import { createHash, createHmac, randomBytes, randomInt, scryptSync, timingSafeEqual } from 'node:crypto'

/**
 * 站长登录：密码（scrypt 哈希）+ TOTP 两步验证 + 一次性恢复码。
 * 只有一个账号。会话令牌只在服务器上保存哈希值。
 */

const AUTH_FILE = 'auth.json'
const SETUP_KEY_FILE = 'setup-key.txt'

const SESSION_TTL_SHORT_MS = 12 * 60 * 60 * 1000
const SESSION_TTL_REMEMBER_MS = 30 * 24 * 60 * 60 * 1000
const PENDING_TTL_MS = 10 * 60 * 1000
const MAX_SESSIONS = 20

const IP_MAX_FAILS = 5
const IP_LOCK_MS = 15 * 60 * 1000
const GLOBAL_WINDOW_MS = 15 * 60 * 1000
const GLOBAL_MAX_FAILS = 20

const MIN_PASSWORD_LENGTH = 10
const RECOVERY_CODE_COUNT = 10

const SCRYPT_N = 32768
const SCRYPT_R = 8
const SCRYPT_P = 1
const SCRYPT_KEYLEN = 64
const SCRYPT_MAXMEM = 128 * SCRYPT_N * SCRYPT_R * 2

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const CODE_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'
const TOTP_REGEX = /^\d{6}$/
const NON_ALNUM_REGEX = /[^a-z0-9]/g
const WHITESPACE_REGEX = /\s+/g
const BASE32_PADDING_REGEX = /=+$/

interface SessionRecord {
  id: string
  createdAt: number
  expiresAt: number
  remember: boolean
}

interface PendingTotp {
  tokenHash: string
  secret: string
  purpose: 'setup' | 'rebind'
  passwordHash?: string
  expiresAt: number
}

interface AuthData {
  passwordHash: string | null
  totpSecret: string | null
  totpLastCounter: number
  recoveryCodes: string[]
  sessions: SessionRecord[]
  setupKey: string | null
  pending: PendingTotp | null
}

export class AuthError extends Error {
  status: number
  retryAfter?: number

  constructor(status: number, message: string, retryAfter?: number) {
    super(message)
    this.status = status
    this.retryAfter = retryAfter
  }
}

export interface NewSession {
  token: string
  /** 记住设备时 cookie 的有效秒数；不记住时为 undefined（浏览器关闭即失效） */
  maxAgeSeconds?: number
}

export interface TotpEnrollment {
  token: string
  secret: string
  uri: string
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length)
    return false
  return timingSafeEqual(bufA, bufB)
}

function base32Encode(buf: Buffer): string {
  let bits = 0
  let value = 0
  let output = ''
  for (const byte of buf) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0)
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  return output
}

function base32Decode(input: string): Buffer {
  const clean = input.replace(BASE32_PADDING_REGEX, '').toUpperCase()
  let bits = 0
  let value = 0
  const bytes: number[] = []
  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char)
    if (idx === -1)
      continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return Buffer.from(bytes)
}

function hotp(secret: Buffer, counter: number): string {
  const msg = Buffer.alloc(8)
  msg.writeBigUInt64BE(BigInt(counter))
  const digest = createHmac('sha1', secret).update(msg).digest()
  const offset = digest.at(-1)! & 0x0F
  const binary = ((digest[offset]! & 0x7F) << 24)
    | (digest[offset + 1]! << 16)
    | (digest[offset + 2]! << 8)
    | digest[offset + 3]!
  return String(binary % 1_000_000).padStart(6, '0')
}

/** 匹配成功返回使用的时间步，用于防止同一个验证码被重复使用 */
function matchTotp(secretBase32: string, code: string, lastCounter: number): number | null {
  if (!TOTP_REGEX.test(code))
    return null
  const secret = base32Decode(secretBase32)
  const current = Math.floor(Date.now() / 1000 / 30)
  for (const counter of [current - 1, current, current + 1]) {
    if (counter <= lastCounter)
      continue
    if (safeEqual(hotp(secret, counter), code))
      return counter
  }
  return null
}

function randomCode(length: number, alphabet: string): string {
  let out = ''
  for (let i = 0; i < length; i++)
    out += alphabet[randomInt(alphabet.length)]
  return out
}

function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: SCRYPT_MAXMEM })
  return ['scrypt', SCRYPT_N, SCRYPT_R, SCRYPT_P, salt.toString('base64'), hash.toString('base64')].join('$')
}

function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt')
    return false
  const [, n, r, p, saltB64, hashB64] = parts
  const expected = Buffer.from(hashB64!, 'base64')
  const actual = scryptSync(password, Buffer.from(saltB64!, 'base64'), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: 128 * Number(n) * Number(r) * 2,
  })
  return timingSafeEqual(expected, actual)
}

function normalizeRecoveryCode(code: string): string {
  return code.toLowerCase().replace(NON_ALNUM_REGEX, '')
}

function validatePassword(password: unknown): string {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH)
    throw new AuthError(400, `密码至少 ${MIN_PASSWORD_LENGTH} 位`)
  if (password.length > 256)
    throw new AuthError(400, '密码太长')
  return password
}

export class AuthService {
  private store: JsonStore
  private data: AuthData
  private ipFails = new Map<string, { count: number, lockedUntil: number }>()
  private globalFails: number[] = []
  private issuer: string

  constructor(store: JsonStore, issuer = 'SIMerald') {
    this.store = store
    this.issuer = issuer
    this.data = store.read<AuthData>(AUTH_FILE, {
      passwordHash: null,
      totpSecret: null,
      totpLastCounter: 0,
      recoveryCodes: [],
      sessions: [],
      setupKey: null,
      pending: null,
    })
    this.ensureSetupKey()
  }

  private save(): void {
    this.store.write(AUTH_FILE, this.data)
  }

  isSetupRequired(): boolean {
    return !this.data.passwordHash || !this.data.totpSecret
  }

  /** 首次启动时生成一次性设置密钥，防止别人抢先设置站长密码 */
  private ensureSetupKey(): void {
    if (!this.isSetupRequired())
      return
    if (!this.data.setupKey) {
      const raw = randomCode(12, BASE32_ALPHABET)
      this.data.setupKey = `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8)}`
      this.save()
    }
    this.store.writeText(SETUP_KEY_FILE, `${this.data.setupKey}\n`)
    console.log(`[auth] 还没有设置站长账号。首次设置密钥：${this.data.setupKey}（也保存在数据目录的 ${SETUP_KEY_FILE}）`)
  }

  // ===== 防暴力破解 =====

  private checkLock(ip: string): void {
    const now = Date.now()
    const entry = this.ipFails.get(ip)
    if (entry && entry.lockedUntil > now)
      throw new AuthError(429, '尝试次数过多，请稍后再试', Math.ceil((entry.lockedUntil - now) / 1000))

    this.globalFails = this.globalFails.filter(t => now - t < GLOBAL_WINDOW_MS)
    if (this.globalFails.length >= GLOBAL_MAX_FAILS) {
      const oldest = this.globalFails[0] ?? now
      throw new AuthError(429, '尝试次数过多，请稍后再试', Math.ceil((oldest + GLOBAL_WINDOW_MS - now) / 1000))
    }
  }

  private recordFail(ip: string): void {
    const now = Date.now()
    const entry = this.ipFails.get(ip) ?? { count: 0, lockedUntil: 0 }
    entry.count += 1
    if (entry.count >= IP_MAX_FAILS) {
      entry.lockedUntil = now + IP_LOCK_MS
      entry.count = 0
      console.warn(`[auth] ${ip} 连续输错，锁定 15 分钟`)
    }
    this.ipFails.set(ip, entry)
    this.globalFails.push(now)
  }

  private recordSuccess(ip: string): void {
    this.ipFails.delete(ip)
  }

  // ===== 会话 =====

  private pruneSessions(): void {
    const now = Date.now()
    const before = this.data.sessions.length
    this.data.sessions = this.data.sessions.filter(s => s.expiresAt > now)
    if (this.data.sessions.length > MAX_SESSIONS)
      this.data.sessions = this.data.sessions.slice(-MAX_SESSIONS)
    if (this.data.sessions.length !== before)
      this.save()
  }

  private createSession(remember: boolean): NewSession {
    this.pruneSessions()
    const token = randomBytes(32).toString('base64url')
    const now = Date.now()
    const ttl = remember ? SESSION_TTL_REMEMBER_MS : SESSION_TTL_SHORT_MS
    this.data.sessions.push({ id: sha256(token), createdAt: now, expiresAt: now + ttl, remember })
    this.save()
    return { token, maxAgeSeconds: remember ? Math.floor(ttl / 1000) : undefined }
  }

  isValidSession(token: string | undefined): boolean {
    if (!token || this.isSetupRequired())
      return false
    const id = sha256(token)
    const now = Date.now()
    return this.data.sessions.some(s => s.id === id && s.expiresAt > now)
  }

  logout(token: string | undefined): void {
    if (!token)
      return
    const id = sha256(token)
    this.data.sessions = this.data.sessions.filter(s => s.id !== id)
    this.save()
  }

  logoutOthers(currentToken: string | undefined): void {
    const id = currentToken ? sha256(currentToken) : ''
    this.data.sessions = this.data.sessions.filter(s => s.id === id)
    this.save()
  }

  sessionCount(): number {
    const now = Date.now()
    return this.data.sessions.filter(s => s.expiresAt > now).length
  }

  recoveryCodesLeft(): number {
    return this.data.recoveryCodes.length
  }

  // ===== 验证 =====

  /** 校验 6 位验证码或恢复码；恢复码用过即作废 */
  private verifySecondFactor(code: unknown, secret = this.data.totpSecret): boolean {
    if (typeof code !== 'string' || !secret)
      return false
    const trimmed = code.replace(WHITESPACE_REGEX, '')
    const counter = matchTotp(secret, trimmed, this.data.totpLastCounter)
    if (counter !== null) {
      this.data.totpLastCounter = counter
      this.save()
      return true
    }
    const normalized = normalizeRecoveryCode(trimmed)
    if (normalized.length !== 10)
      return false
    const hash = sha256(normalized)
    const index = this.data.recoveryCodes.findIndex(stored => safeEqual(stored, hash))
    if (index === -1)
      return false
    this.data.recoveryCodes.splice(index, 1)
    this.save()
    console.warn(`[auth] 使用了一个恢复码，还剩 ${this.data.recoveryCodes.length} 个`)
    return true
  }

  /** 修改账号设置前再确认一次密码和验证码 */
  private reauthenticate(ip: string, password: unknown, code: unknown): void {
    this.checkLock(ip)
    const passwordOk = typeof password === 'string' && !!this.data.passwordHash && verifyPassword(password, this.data.passwordHash)
    if (!passwordOk || !this.verifySecondFactor(code)) {
      this.recordFail(ip)
      throw new AuthError(401, '密码或验证码错误')
    }
    this.recordSuccess(ip)
  }

  private generateRecoveryCodes(): string[] {
    const codes: string[] = []
    for (let i = 0; i < RECOVERY_CODE_COUNT; i++) {
      const raw = randomCode(10, CODE_ALPHABET)
      codes.push(`${raw.slice(0, 5)}-${raw.slice(5)}`)
    }
    this.data.recoveryCodes = codes.map(c => sha256(normalizeRecoveryCode(c)))
    return codes
  }

  private createEnrollment(purpose: PendingTotp['purpose'], passwordHash?: string): TotpEnrollment {
    const secret = base32Encode(randomBytes(20))
    const token = randomBytes(24).toString('base64url')
    this.data.pending = { tokenHash: sha256(token), secret, purpose, passwordHash, expiresAt: Date.now() + PENDING_TTL_MS }
    this.save()
    const label = encodeURIComponent(`${this.issuer}:owner`)
    const uri = `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(this.issuer)}&algorithm=SHA1&digits=6&period=30`
    return { token, secret, uri }
  }

  private takePending(token: unknown, purpose: PendingTotp['purpose']): PendingTotp {
    const pending = this.data.pending
    if (!pending || pending.purpose !== purpose || typeof token !== 'string' || !safeEqual(pending.tokenHash, sha256(token)))
      throw new AuthError(400, '设置流程已失效，请重新开始')
    if (pending.expiresAt < Date.now()) {
      this.data.pending = null
      this.save()
      throw new AuthError(400, '设置流程已超时，请重新开始')
    }
    return pending
  }

  // ===== 首次设置 =====

  beginSetup(ip: string, setupKey: unknown, password: unknown): TotpEnrollment {
    if (!this.isSetupRequired())
      throw new AuthError(409, '站长账号已经设置过了')
    this.checkLock(ip)
    const key = typeof setupKey === 'string' ? setupKey.trim().toUpperCase() : ''
    if (!this.data.setupKey || !safeEqual(key, this.data.setupKey)) {
      this.recordFail(ip)
      throw new AuthError(401, '设置密钥不正确')
    }
    const validPassword = validatePassword(password)
    this.recordSuccess(ip)
    return this.createEnrollment('setup', hashPassword(validPassword))
  }

  finishSetup(ip: string, token: unknown, code: unknown): { session: NewSession, recoveryCodes: string[] } {
    if (!this.isSetupRequired())
      throw new AuthError(409, '站长账号已经设置过了')
    this.checkLock(ip)
    const pending = this.takePending(token, 'setup')
    const counter = typeof code === 'string' ? matchTotp(pending.secret, code.trim(), 0) : null
    if (counter === null) {
      this.recordFail(ip)
      throw new AuthError(401, '验证码不正确，请确认手机时间准确后重试')
    }
    this.data.passwordHash = pending.passwordHash ?? null
    this.data.totpSecret = pending.secret
    this.data.totpLastCounter = counter
    this.data.pending = null
    this.data.setupKey = null
    const recoveryCodes = this.generateRecoveryCodes()
    this.data.sessions = []
    this.save()
    this.store.writeText(SETUP_KEY_FILE, '站长账号已设置，这个密钥已作废。\n')
    console.log('[auth] 站长账号设置完成')
    return { session: this.createSession(false), recoveryCodes }
  }

  // ===== 登录 =====

  login(ip: string, password: unknown, code: unknown, remember: unknown): NewSession {
    if (this.isSetupRequired())
      throw new AuthError(409, '请先完成首次设置')
    this.checkLock(ip)
    const passwordOk = typeof password === 'string' && password.length <= 256
      && verifyPassword(password, this.data.passwordHash!)
    // 密码错误时不再校验验证码，避免消耗恢复码
    if (!passwordOk || !this.verifySecondFactor(code)) {
      this.recordFail(ip)
      console.warn(`[auth] 登录失败：${ip}`)
      throw new AuthError(401, '密码或验证码错误')
    }
    this.recordSuccess(ip)
    console.log(`[auth] 登录成功：${ip}`)
    return this.createSession(remember === true)
  }

  // ===== 账号安全 =====

  changePassword(ip: string, currentPassword: unknown, code: unknown, newPassword: unknown, currentToken: string | undefined): void {
    const next = validatePassword(newPassword)
    this.reauthenticate(ip, currentPassword, code)
    this.data.passwordHash = hashPassword(next)
    this.save()
    this.logoutOthers(currentToken)
    console.log('[auth] 密码已修改，其他设备已退出')
  }

  beginRebind(ip: string, currentPassword: unknown, code: unknown): TotpEnrollment {
    this.reauthenticate(ip, currentPassword, code)
    return this.createEnrollment('rebind')
  }

  finishRebind(ip: string, token: unknown, code: unknown): string[] {
    this.checkLock(ip)
    const pending = this.takePending(token, 'rebind')
    const counter = typeof code === 'string' ? matchTotp(pending.secret, code.trim(), 0) : null
    if (counter === null) {
      this.recordFail(ip)
      throw new AuthError(401, '验证码不正确，请确认手机时间准确后重试')
    }
    this.data.totpSecret = pending.secret
    this.data.totpLastCounter = counter
    this.data.pending = null
    const codes = this.generateRecoveryCodes()
    this.save()
    console.log('[auth] 两步验证已重新绑定')
    return codes
  }

  regenerateRecoveryCodes(ip: string, currentPassword: unknown, code: unknown): string[] {
    this.reauthenticate(ip, currentPassword, code)
    const codes = this.generateRecoveryCodes()
    this.save()
    return codes
  }
}
