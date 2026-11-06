import type { ErrorParams } from '../shared/types.ts'

/**
 * An error that reaches the browser. `code` is translated by the frontend (`errors.<code>` in the
 * locale dictionaries) with `params` as interpolation values; `message` is an English fallback for
 * logs and API clients.
 */
export class AppError extends Error {
  status: number
  code: string
  params: ErrorParams
  retryAfter?: number

  constructor(status: number, code: string, message: string, params: ErrorParams = {}, retryAfter?: number) {
    super(message)
    this.status = status
    this.code = code
    this.params = params
    this.retryAfter = retryAfter
  }
}
