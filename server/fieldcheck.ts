import type { FieldIssue, NotionDbKey } from '../shared/types.ts'
import type { FieldMapping } from './mapping.ts'
import type { NotionPropertySchema } from './notion.ts'

/**
 * Compares the mapped column names against a data source schema, so the admin panel can point at
 * columns that are missing or of a type the property extractors in notion.ts cannot read.
 */

// Property types accepted by each extractor in notion.ts
const TEXT = ['title', 'rich_text', 'select', 'status', 'phone_number', 'email', 'url', 'number', 'multi_select', 'formula', 'rollup']
const NUMBER = ['number', 'formula', 'rollup']
const DATE = ['date', 'created_time', 'formula', 'rollup']
const LIST = ['multi_select', 'rollup', ...TEXT.filter(t => t !== 'multi_select' && t !== 'rollup')]
const RELATION = ['relation']

interface FieldRule {
  types: string[]
  /** Drives the public card wall; shown more prominently when broken */
  important: boolean
}

const CARD_RULES: Record<keyof FieldMapping['cards'], FieldRule> = {
  name: { types: ['title'], important: true },
  number: { types: TEXT, important: true },
  country: { types: TEXT, important: true },
  type: { types: TEXT, important: false },
  device: { types: TEXT, important: false },
  keepAlive: { types: LIST, important: false },
  cycle: { types: TEXT, important: true },
  price: { types: NUMBER, important: true },
  currency: { types: TEXT, important: true },
  balance: { types: NUMBER, important: false },
  balanceUpdatedAt: { types: DATE, important: false },
  expiresAt: { types: DATE, important: true },
  nextRenewal: { types: DATE, important: false },
  nextRenewalOverride: { types: DATE, important: false },
  status: { types: TEXT, important: true },
  cancelledAt: { types: DATE, important: true },
  firstPurchaseAt: { types: DATE, important: false },
  totalSpentCNY: { types: NUMBER, important: false },
  urgency: { types: TEXT, important: false },
  services: { types: LIST, important: false },
  account: { types: TEXT, important: false },
  paymentAccounts: { types: RELATION, important: false },
  dataCheck: { types: TEXT, important: false },
}

const RECORD_RULES: Record<keyof FieldMapping['records'], FieldRule> = {
  title: { types: ['title'], important: false },
  card: { types: RELATION, important: true },
  type: { types: TEXT, important: true },
  date: { types: DATE, important: true },
  amount: { types: NUMBER, important: true },
  currency: { types: TEXT, important: true },
  rate: { types: NUMBER, important: false },
  amountCNY: { types: NUMBER, important: true },
  extendsTo: { types: DATE, important: true },
  accounts: { types: RELATION, important: false },
}

const RULES: Record<NotionDbKey, Record<string, FieldRule>> = { cards: CARD_RULES, records: RECORD_RULES }

export function checkFields(db: NotionDbKey, schema: Record<string, NotionPropertySchema>, mapping: FieldMapping): FieldIssue[] {
  const columns = mapping[db] as Record<string, string>
  const hasTitle = Object.values(schema).some(p => p.type === 'title')
  const issues: FieldIssue[] = []
  for (const [key, rule] of Object.entries(RULES[db])) {
    const column = columns[key] ?? ''
    const property = schema[column]
    // Title columns fall back to whatever title property the database has (see findTitleProperty)
    if (rule.types.length === 1 && rule.types[0] === 'title' && !property && hasTitle)
      continue
    if (!property)
      issues.push({ db, key, column, problem: 'missing', expectedTypes: rule.types, important: rule.important })
    else if (!rule.types.includes(property.type))
      issues.push({ db, key, column, problem: 'type', actualType: property.type, expectedTypes: rule.types, important: rule.important })
  }
  return issues.sort((a, b) => Number(b.important) - Number(a.important))
}
