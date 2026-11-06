/**
 * Renders the Notion template definition into docs/notion-template/ and checks that it agrees
 * with the backend (column presets, value vocabularies, kind detection, supported currencies).
 *
 *   node scripts/notion-template/build.ts           check, then write the docs
 *   node scripts/notion-template/build.ts --check   check only (exit code 1 on problems)
 *   node scripts/notion-template/build.ts --json zh print the rendered template as JSON
 */

import type { NotionPropertySchema } from '../../server/notion.ts'
import type { Column, Database, Lang } from './template.ts'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { detectKind, parseCountry, parseCurrency, parseCycleDays } from '../../server/cards.ts'
import { checkFields } from '../../server/fieldcheck.ts'
import { PRESETS, resolveKeepAliveCode, resolveRecordKind } from '../../server/mapping.ts'
import {
  CURRENCIES,
  DATABASES,
  findColumn,
  findDatabase,
  findOption,
  GUIDE,
  PAGE,
  RECORD_TITLE_TYPE,
  renderFormula,
  SAMPLE_ACCOUNTS,
  SAMPLE_CARDS,
  SAMPLE_ICON,
  TEMPLATE_VERSION,
} from './template.ts'

const ROOT = path.resolve(import.meta.dirname, '../..')
const OUT_DIR = path.join(ROOT, 'docs/notion-template')
const LANGS: Lang[] = ['zh', 'en']
const CURRENCY_KEY_REGEX = /^\s+([A-Z]{3}):/gm
const PIPE_REGEX = /\|/g
const NEWLINE_REGEX = /\n/g

// ===== Consistency checks =====

function check(): string[] {
  const problems: string[] = []

  for (const lang of LANGS) {
    const preset = PRESETS[lang]
    for (const db of ['cards', 'records'] as const) {
      const schema: Record<string, NotionPropertySchema> = {}
      for (const column of findDatabase(db).columns) {
        // Formulas and rollups are stored as such in Notion
        schema[column.name[lang]] = { id: column.key, name: column.name[lang], type: column.type }
      }
      for (const issue of checkFields(db, schema, preset))
        problems.push(`[${lang}] preset ${db}.${issue.key} → "${issue.column}": ${issue.problem}${issue.actualType ? ` (${issue.actualType})` : ''}`)
    }

    const statusTexts = { active: 'Active', expired: 'Expired', cancelled: 'Cancelled' } as const
    const zhStatus = { active: '使用中', expired: '已过期', cancelled: '已注销' } as const
    for (const key of ['active', 'expired', 'cancelled'] as const) {
      const text = lang === 'zh' ? zhStatus[key] : statusTexts[key]
      if (!preset.statusValues[key].includes(text))
        problems.push(`[${lang}] statusValues.${key} does not include "${text}"`)
    }

    for (const option of findColumn('records', 'type').options!) {
      const kind = resolveRecordKind(option.name[lang], preset)
      if (kind !== option.key)
        problems.push(`[${lang}] record type "${option.name[lang]}" resolves to ${kind}, expected ${option.key}`)
    }

    for (const option of findColumn('cards', 'keepAlive').options!) {
      const code = resolveKeepAliveCode(option.name[lang], preset)
      if (code !== option.key)
        problems.push(`[${lang}] keep-alive "${option.name[lang]}" resolves to ${code}, expected ${option.key}`)
    }

    for (const option of findColumn('cards', 'type').options!) {
      const kind = detectKind(option.name[lang])
      if (kind !== option.key)
        problems.push(`[${lang}] card type "${option.name[lang]}" is detected as ${kind}, expected ${option.key}`)
    }

    for (const option of findColumn('cards', 'cycle').options!) {
      const days = parseCycleDays(option.name[lang])
      const expected = option.key === 'varies' ? 0 : Number(option.key)
      if (days !== expected)
        problems.push(`[${lang}] cycle "${option.name[lang]}" parses as ${days} days, expected ${expected}`)
    }

    for (const option of findColumn('cards', 'country').options!) {
      if (!parseCountry(option.name[lang]).region)
        problems.push(`[${lang}] country "${option.name[lang]}" has no flag emoji`)
    }

    for (const db of DATABASES) {
      for (const column of db.columns.filter(c => c.formula))
        renderFormula(lang, db.key, column)
    }
  }

  // Every template currency must be convertible by the frontend
  const financeSource = readFileSync(path.join(ROOT, 'src/utils/financeHelper.ts'), 'utf-8')
  const configBlock = financeSource.slice(financeSource.indexOf('FINANCE_CURRENCY_CONFIG = {'), financeSource.indexOf('} as const'))
  const supported = new Set(Array.from(configBlock.matchAll(CURRENCY_KEY_REGEX), m => m[1]))
  for (const currency of CURRENCIES) {
    if (!supported.has(currency.code))
      problems.push(`currency ${currency.code} is not supported by src/utils/financeHelper.ts`)
    if (parseCurrency(`${currency.code} ${currency.symbol}`) !== currency.code)
      problems.push(`currency option "${currency.code} ${currency.symbol}" does not parse back to ${currency.code}`)
  }

  // Relations must point at each other
  for (const db of DATABASES) {
    for (const column of db.columns.filter(c => c.relation)) {
      const back = findColumn(column.relation!.target, column.relation!.dual)
      if (back.relation?.target !== db.key || back.relation.dual !== column.key)
        problems.push(`relation ${db.key}.${column.key} ↔ ${column.relation!.target}.${column.relation!.dual} is not symmetric`)
    }
  }

  // Sample rows must only use defined options
  for (const card of SAMPLE_CARDS) {
    findOption('cards', 'country', card.country)
    findOption('cards', 'type', card.type)
    if (card.device)
      findOption('cards', 'device', card.device)
    card.keepAlive.forEach(k => findOption('cards', 'keepAlive', k))
    findOption('cards', 'cycle', card.cycle)
    findOption('cards', 'currency', card.currency)
    card.services.forEach(s => findOption('cards', 'services', s))
    for (const record of card.records) {
      findOption('records', 'type', record.type)
      findOption('records', 'currency', record.currency)
    }
  }
  return problems
}

// ===== Rendering =====

const TEXT = {
  zh: {
    heading: `SIMerald Notion 模板 ${TEMPLATE_VERSION}（中文）`,
    generated: '本文件由 `scripts/notion-template/build.ts` 根据 `scripts/notion-template/template.ts` 生成，请勿手动修改。',
    intro: '这是 SIMerald 官方 Notion 中文模板的完整定义：三个数据库的每一列、选项、公式原文和示例数据。可以照着它核对自己复制的模板，或者手动建库。',
    otherLang: 'English version: [template.md](template.md)',
    columns: '列名',
    type: '类型',
    details: '选项 / 计算方式',
    description: '说明',
    mapping: 'SIMerald 字段',
    formulas: '公式原文',
    formulaHint: '复制代码块里的全部内容，粘贴到 Notion 公式编辑器即可。',
    seeFormula: '见下方公式原文',
    rollupOf: (rel: string, prop: string, fn: string) => `汇总「${rel}」的「${prop}」，${fn === 'sum' ? '求和' : '取最早日期'}`,
    relationTo: (db: string, dual: string, limit?: 1) => `关联「${db}」，双向，对方列名「${dual}」${limit ? '，限 1 条' : ''}`,
    precision: (n: number) => `显示 ${n} 位小数`,
    samples: '示例数据',
    sampleHint: `模板里带 ${SAMPLE_ICON} 图标的行是示例，熟悉后删掉即可。号码和运营商都是虚构的。`,
    page: '模板页面',
    pageText: (title: string, source: string, renewals: string, dashboard: string) => `模板页面「${title}」顶部是使用指南，下面是「${renewals}」（按下次续费日期排序的卡片表）和「${dashboard}」（待修数据计数、消费占比图表），三个数据库放在子页面「${source}」里。`,
  },
  en: {
    heading: `SIMerald Notion template ${TEMPLATE_VERSION} (English)`,
    generated: 'This file is generated by `scripts/notion-template/build.ts` from `scripts/notion-template/template.ts`. Do not edit it by hand.',
    intro: 'Complete definition of the official English SIMerald Notion template: every column, option, formula and sample row of its three databases. Use it to check a copied template or to build the databases by hand.',
    otherLang: '中文版：[template.zh-CN.md](template.zh-CN.md)',
    columns: 'Column',
    type: 'Type',
    details: 'Options / logic',
    description: 'Description',
    mapping: 'SIMerald field',
    formulas: 'Formulas',
    formulaHint: 'Copy the whole code block into the Notion formula editor.',
    seeFormula: 'see formulas below',
    rollupOf: (rel: string, prop: string, fn: string) => `Rollup of "${prop}" through "${rel}", ${fn === 'sum' ? 'sum' : 'earliest date'}`,
    relationTo: (db: string, dual: string, limit?: 1) => `Relation to "${db}", two-way, synced as "${dual}"${limit ? ', limit 1' : ''}`,
    precision: (n: number) => `${n} decimal places`,
    samples: 'Sample data',
    sampleHint: `Rows with the ${SAMPLE_ICON} icon are samples; delete them once you are familiar with the template. Carriers and numbers are fictional.`,
    page: 'Template page',
    pageText: (title: string, source: string, renewals: string, dashboard: string) => `The template page "${title}" starts with a usage guide, followed by "${renewals}" (the cards sorted by next renewal date) and "${dashboard}" (counters of rows to fix and spending charts). The three databases live in the sub-page "${source}".`,
  },
}

const TYPE_LABELS: Record<Column['type'], string> = {
  title: 'Title',
  rich_text: 'Text',
  phone_number: 'Phone',
  number: 'Number',
  select: 'Select',
  multi_select: 'Multi-select',
  date: 'Date',
  formula: 'Formula',
  rollup: 'Rollup',
  relation: 'Relation',
}

function cell(text: string): string {
  return text.replace(PIPE_REGEX, '\\|').replace(NEWLINE_REGEX, ' ')
}

function mappingKey(lang: Lang, db: Database, column: Column): string {
  if (db.key === 'accounts')
    return column.type === 'title' ? '`accounts` (title)' : ''
  const section = PRESETS[lang][db.key] as Record<string, string>
  const key = Object.keys(section).find(k => section[k] === column.name[lang])
  return key ? `\`${db.key}.${key}\`` : ''
}

function details(lang: Lang, db: Database, column: Column): string {
  const text = TEXT[lang]
  if (column.options)
    return column.options.map(o => o.name[lang]).join(', ')
  if (column.formula)
    return text.seeFormula
  if (column.rollup)
    return text.rollupOf(findColumn(db.key, column.rollup.relation).name[lang], findColumn(findColumn(db.key, column.rollup.relation).relation!.target, column.rollup.property).name[lang], column.rollup.function)
  if (column.relation)
    return text.relationTo(findDatabase(column.relation.target).name[lang], findColumn(column.relation.target, column.relation.dual).name[lang], column.relation.limit)
  if (column.precision)
    return text.precision(column.precision)
  return ''
}

function renderDoc(lang: Lang): string {
  const text = TEXT[lang]
  const out: string[] = [
    `# ${text.heading}`,
    '',
    `> ${text.generated}`,
    '',
    text.intro,
    '',
    text.otherLang,
    '',
    `## ${text.page}`,
    '',
    text.pageText(`${PAGE.icon} ${PAGE.title[lang]}`, PAGE.sourcePage[lang], PAGE.views.renewals[lang], PAGE.views.dashboard[lang]),
    '',
    ...GUIDE[lang].split('\n').map(line => `> ${line}`),
    '',
  ]

  for (const db of DATABASES) {
    out.push(`## ${db.icon} ${db.name[lang]}`, '', db.description[lang], '')
    out.push(`| ${text.columns} | ${text.type} | ${text.details} | ${text.description} | ${text.mapping} |`, '| --- | --- | --- | --- | --- |')
    for (const column of db.columns)
      out.push(`| ${cell(column.name[lang])} | ${TYPE_LABELS[column.type]} | ${cell(details(lang, db, column))} | ${cell(column.description[lang])} | ${mappingKey(lang, db, column)} |`)
    out.push('')
  }

  out.push(`## ${text.formulas}`, '', text.formulaHint, '')
  for (const db of DATABASES) {
    for (const column of db.columns.filter(c => c.formula)) {
      out.push(`### ${db.name[lang]} · ${column.name[lang]}`, '', '```text', renderFormula(lang, db.key, column), '```', '')
    }
  }

  out.push(`## ${text.samples}`, '', text.sampleHint, '')
  const cardsDb = findDatabase('cards')
  const recordsDb = findDatabase('records')
  const cardCols = ['name', 'number', 'country', 'type', 'cycle', 'price', 'currency', 'cancelledAt'].map(k => findColumn('cards', k).name[lang])
  out.push(`### ${cardsDb.name[lang]}`, '', `| ${cardCols.join(' | ')} |`, `| ${cardCols.map(() => '---').join(' | ')} |`)
  for (const card of SAMPLE_CARDS) {
    out.push(`| ${[
      `${SAMPLE_ICON} ${sampleCardName(card.carrier, card.number)}`,
      card.number,
      findOption('cards', 'country', card.country).name[lang],
      findOption('cards', 'type', card.type).name[lang],
      findOption('cards', 'cycle', card.cycle).name[lang],
      String(card.price),
      findOption('cards', 'currency', card.currency).name[lang],
      card.cancelledAt ?? '',
    ].map(cell).join(' | ')} |`)
  }
  const recordCols = ['title', 'type', 'date', 'amount', 'currency', 'rate', 'extendsTo'].map(k => findColumn('records', k).name[lang])
  out.push('', `### ${recordsDb.name[lang]}`, '', `| ${recordCols.join(' | ')} |`, `| ${recordCols.map(() => '---').join(' | ')} |`)
  for (const card of SAMPLE_CARDS) {
    for (const record of card.records) {
      out.push(`| ${[
        `${SAMPLE_ICON} ${sampleRecordTitle(lang, card.carrier, card.number, record.type, record.date)}`,
        findOption('records', 'type', record.type).name[lang],
        record.date,
        String(record.amount),
        findOption('records', 'currency', record.currency).name[lang],
        record.rate === null ? '' : String(record.rate),
        record.extendsTo ?? '',
      ].map(cell).join(' | ')} |`)
    }
  }
  out.push('', `### ${findDatabase('accounts').name[lang]}`, '')
  for (const account of SAMPLE_ACCOUNTS)
    out.push(`- ${SAMPLE_ICON} ${account.name[lang]}（${findOption('accounts', 'type', account.type).name[lang]}）`)
  out.push('')
  return out.join('\n')
}

export function sampleCardName(carrier: string, number: string): string {
  return `${carrier} · ${number.slice(-4)}`
}

export function sampleRecordTitle(lang: Lang, carrier: string, number: string, type: string, date: string): string {
  return `${sampleCardName(carrier, number)} · ${RECORD_TITLE_TYPE[type]![lang]} · ${date}`
}

function renderJson(lang: Lang): unknown {
  return {
    version: TEMPLATE_VERSION,
    page: { icon: PAGE.icon, title: PAGE.title[lang], sourcePage: PAGE.sourcePage[lang], views: { renewals: PAGE.views.renewals[lang], dashboard: PAGE.views.dashboard[lang] }, guide: GUIDE[lang] },
    databases: DATABASES.map(db => ({
      key: db.key,
      icon: db.icon,
      name: db.name[lang],
      description: db.description[lang],
      columns: db.columns.map(column => ({
        key: column.key,
        name: column.name[lang],
        type: column.type,
        description: column.description[lang],
        options: column.options?.map(o => ({ name: o.name[lang], color: o.color })),
        precision: column.precision,
        formula: column.formula ? renderFormula(lang, db.key, column) : undefined,
        rollup: column.rollup
          ? { relation: findColumn(db.key, column.rollup.relation).name[lang], property: findColumn(findColumn(db.key, column.rollup.relation).relation!.target, column.rollup.property).name[lang], function: column.rollup.function }
          : undefined,
        relation: column.relation
          ? { target: column.relation.target, dual: findColumn(column.relation.target, column.relation.dual).name[lang], limit: column.relation.limit }
          : undefined,
      })),
    })),
    samples: {
      icon: SAMPLE_ICON,
      accounts: SAMPLE_ACCOUNTS.map(a => ({ key: a.key, name: a.name[lang], type: findOption('accounts', 'type', a.type).name[lang], status: findOption('accounts', 'status', a.status).name[lang] })),
      cards: SAMPLE_CARDS.map(card => ({
        name: sampleCardName(card.carrier, card.number),
        number: card.number,
        country: findOption('cards', 'country', card.country).name[lang],
        type: findOption('cards', 'type', card.type).name[lang],
        device: card.device ? findOption('cards', 'device', card.device).name[lang] : null,
        keepAlive: card.keepAlive.map(k => findOption('cards', 'keepAlive', k).name[lang]),
        cycle: findOption('cards', 'cycle', card.cycle).name[lang],
        price: card.price,
        currency: findOption('cards', 'currency', card.currency).name[lang],
        balance: card.balance,
        balanceUpdatedAt: card.balanceUpdatedAt,
        cancelledAt: card.cancelledAt,
        services: card.services.map(s => findOption('cards', 'services', s).name[lang]),
        account: card.account,
        paymentAccount: card.paymentAccount,
        records: card.records.map(record => ({
          title: sampleRecordTitle(lang, card.carrier, card.number, record.type, record.date),
          type: findOption('records', 'type', record.type).name[lang],
          date: record.date,
          amount: record.amount,
          currency: findOption('records', 'currency', record.currency).name[lang],
          rate: record.rate,
          extendsTo: record.extendsTo,
          account: record.account,
        })),
      })),
    },
  }
}

// ===== Entry point =====

const args = process.argv.slice(2)
const problems = check()
if (problems.length) {
  console.error(`Template check failed:\n- ${problems.join('\n- ')}`)
  process.exit(1)
}

if (args[0] === '--json') {
  const lang = (args[1] ?? 'zh') as Lang
  console.log(JSON.stringify(renderJson(lang), null, 2))
}
else if (args[0] !== '--check') {
  writeFileSync(path.join(OUT_DIR, 'template.zh-CN.md'), renderDoc('zh'))
  writeFileSync(path.join(OUT_DIR, 'template.md'), renderDoc('en'))
  console.log(`Template ${TEMPLATE_VERSION} checked and written to docs/notion-template/`)
}
else {
  console.log(`Template ${TEMPLATE_VERSION} is consistent with the backend`)
}
