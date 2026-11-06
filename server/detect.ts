import type { DetectMatch } from '../shared/types.ts'
import type { MappingPreset } from './mapping.ts'
import type { NotionClient, NotionDataSource, NotionPropertySchema } from './notion.ts'
import { PRESETS } from './mapping.ts'
import { dataSourceTitle } from './notion.ts'

/**
 * Finds SIMerald template databases among the data sources shared with an integration:
 * the SIM card database is recognised by its preset column names, the expense records database
 * by its relation back to it, and the payment accounts database through the card's relation.
 */

/** Minimum number of preset card columns for a data source to count as a SIM card database */
const MIN_CARD_COLUMNS = 10
const DASHES_REGEX = /-/g

function relationTarget(property: NotionPropertySchema | undefined): { dataSourceId?: string, databaseId?: string } | null {
  if (!property || property.type !== 'relation' || !property.relation)
    return null
  return { dataSourceId: property.relation.data_source_id, databaseId: property.relation.database_id }
}

function sameId(a: string | undefined, b: string | undefined): boolean {
  return !!a && !!b && a.replace(DASHES_REGEX, '') === b.replace(DASHES_REGEX, '')
}

function matchesTarget(source: NotionDataSource, target: { dataSourceId?: string, databaseId?: string } | null): boolean {
  if (!target)
    return false
  return sameId(source.id, target.dataSourceId) || sameId(source.parent?.database_id, target.databaseId)
}

function countColumns(source: NotionDataSource, columns: Record<string, string>): number {
  const schema = source.properties ?? {}
  return Object.values(columns).filter(name => name in schema).length
}

export async function detectTemplates(client: NotionClient): Promise<DetectMatch[]> {
  const sources = await client.searchDataSources()
  // Search results normally include the schema; fetch it for any that do not
  for (const source of sources) {
    if (!source.properties)
      source.properties = (await client.getDataSource(source.id)).properties ?? {}
  }

  const matches: DetectMatch[] = []
  for (const cards of sources) {
    let best: { preset: MappingPreset, count: number } | null = null
    for (const preset of ['zh', 'en'] as const) {
      const count = countColumns(cards, PRESETS[preset].cards)
      if (count >= MIN_CARD_COLUMNS && (!best || count > best.count))
        best = { preset, count }
    }
    if (!best)
      continue
    const mapping = PRESETS[best.preset]
    const schema = cards.properties ?? {}

    // Expense records: a data source whose card relation points back at this card database
    const records = sources
      .filter(source => source !== cards)
      .filter((source) => {
        const target = relationTarget(source.properties?.[mapping.records.card])
        return sameId(target?.dataSourceId, cards.id) || sameId(target?.databaseId, cards.parent?.database_id)
      })
      .sort((a, b) => countColumns(b, mapping.records) - countColumns(a, mapping.records))[0] ?? null

    // Payment accounts: the target of the card's default payment account relation
    const accountsTarget = relationTarget(schema[mapping.cards.paymentAccounts])
    const accounts = sources.find(source => matchesTarget(source, accountsTarget)) ?? null

    matches.push({
      preset: best.preset,
      cards: { id: cards.id, title: dataSourceTitle(cards) },
      records: records ? { id: records.id, title: dataSourceTitle(records) } : null,
      accounts: accounts
        ? { id: accounts.id, title: dataSourceTitle(accounts) }
        : accountsTarget?.dataSourceId ? { id: accountsTarget.dataSourceId, title: '' } : null,
      matchedColumns: best.count,
    })
  }
  // Complete templates first, then the closest column match
  return matches.sort((a, b) => Number(!!b.records) - Number(!!a.records) || b.matchedColumns - a.matchedColumns)
}
