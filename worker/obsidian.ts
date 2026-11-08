import { parse as parseYaml } from 'yaml'

/**
 * Reads one Obsidian card note: YAML properties at the top and a renewal-record table in the body.
 * Everything is returned as text; cards.ts turns it into typed SimCard fields.
 */

export type PropValue = string | string[]

export interface ParsedNote {
  props: Record<string, PropValue>
  rows: Record<RecordColumn, string>[]
  /** Problems that did not stop the note from being read */
  problems: { code: string, params: Record<string, string | number>, message: string }[]
}

export class NoteError extends Error {
  code: string
  params: Record<string, string | number>

  constructor(code: string, message: string, params: Record<string, string | number> = {}) {
    super(message)
    this.code = code
    this.params = params
  }
}

export type RecordColumn = 'date' | 'type' | 'amount' | 'currency' | 'rate' | 'extendsTo' | 'note' | 'accounts'

/** Header names accepted for each column of the record table (compared without spaces, case-insensitive) */
const COLUMN_ALIASES: Record<RecordColumn, string[]> = {
  date: ['日期', '消费日期', 'date'],
  type: ['类型', '消费类型', 'type'],
  amount: ['金额', '支付金额', 'amount'],
  currency: ['币种', '货币', 'currency'],
  rate: ['汇率', '当时汇率', 'rate', 'ratetocny'],
  extendsTo: ['有效期延至', '本次有效期延至', '延至', 'extendsto', 'validuntil'],
  note: ['备注', '说明', '记录', 'note', 'record'],
  accounts: ['扣款账户', '账户', 'account', 'paymentaccount'],
}

const FRONTMATTER_REGEX = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/
const TABLE_ROW_REGEX = /^\s*\|.*\|\s*$/
const DIVIDER_CELL_REGEX = /^\s*:?-{3,}:?\s*$/
const WIKILINK_REGEX = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g
const MD_LINK_REGEX = /\[([^\]]*)\]\([^)]*\)/g
const SPACES_REGEX = /\s+/g
const EDGE_PIPES_REGEX = /^\||\|$/g
const CELL_SPLIT_REGEX = /(?<!\\)\|/
const ESCAPED_PIPE_REGEX = /\\\|/g
const LINE_BREAK_REGEX = /\r?\n/

/** Removes Obsidian/Markdown link syntax so `[[Wise]]` and `[Wise](x)` read as `Wise` */
export function plainText(value: string): string {
  return value
    .replace(WIKILINK_REGEX, (_m, target: string, alias?: string) => (alias ?? target).trim())
    .replace(MD_LINK_REGEX, '$1')
    .trim()
}

function toPropValue(value: unknown): PropValue | null {
  if (value === null || value === undefined)
    return null
  if (Array.isArray(value)) {
    const list = value.flatMap(item => (typeof item === 'string' ? [plainText(item)] : [])).filter(Boolean)
    return list
  }
  if (typeof value === 'string')
    return plainText(value)
  return null
}

function splitRow(line: string): string[] {
  const inner = line.trim().replace(EDGE_PIPES_REGEX, '')
  // `\|` is a literal pipe inside a cell
  return inner.split(CELL_SPLIT_REGEX).map(cell => plainText(cell.replace(ESCAPED_PIPE_REGEX, '|')))
}

function headerKey(cell: string): RecordColumn | null {
  const key = cell.replace(SPACES_REGEX, '').toLowerCase()
  for (const [column, aliases] of Object.entries(COLUMN_ALIASES) as [RecordColumn, string[]][]) {
    if (aliases.includes(key))
      return column
  }
  return null
}

/** Finds the first table whose header has a date column and reads its rows */
function readRecordTable(body: string): Record<RecordColumn, string>[] {
  const lines = body.split(LINE_BREAK_REGEX)
  for (let i = 0; i + 1 < lines.length; i++) {
    if (!TABLE_ROW_REGEX.test(lines[i]!) || !TABLE_ROW_REGEX.test(lines[i + 1]!))
      continue
    const divider = splitRow(lines[i + 1]!)
    if (!divider.every(cell => DIVIDER_CELL_REGEX.test(cell)))
      continue
    const columns = splitRow(lines[i]!).map(headerKey)
    if (!columns.includes('date'))
      continue
    const rows: Record<RecordColumn, string>[] = []
    for (let j = i + 2; j < lines.length && TABLE_ROW_REGEX.test(lines[j]!); j++) {
      const cells = splitRow(lines[j]!)
      const row = { date: '', type: '', amount: '', currency: '', rate: '', extendsTo: '', note: '', accounts: '' }
      columns.forEach((column, index) => {
        if (column)
          row[column] = cells[index] ?? ''
      })
      // Skip blank template rows
      if (Object.values(row).some(Boolean))
        rows.push(row)
    }
    return rows
  }
  return []
}

export function parseNote(text: string): ParsedNote {
  const problems: ParsedNote['problems'] = []
  const match = text.match(FRONTMATTER_REGEX)
  if (!match)
    throw new NoteError('note.noFrontmatter', 'The note has no properties block at the top (--- ... ---)')

  let raw: unknown
  try {
    // The failsafe schema keeps every value as text, so "+852..." numbers and leading zeros survive
    raw = parseYaml(match[1]!, { schema: 'failsafe' })
  }
  catch (error) {
    throw new NoteError('note.badFrontmatter', `Properties are not valid YAML: ${error instanceof Error ? error.message : String(error)}`)
  }

  const props: Record<string, PropValue> = {}
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const [key, value] of Object.entries(raw)) {
      const converted = toPropValue(value)
      if (converted === null) {
        problems.push({ code: 'note.ignoredProperty', params: { name: key }, message: `Property "${key}" has an unsupported value and was ignored` })
        continue
      }
      props[key.trim()] = converted
    }
  }

  const rows = readRecordTable(text.slice(match[0].length))
  return { props, rows, problems }
}
