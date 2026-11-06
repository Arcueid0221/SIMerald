/**
 * Single source of truth for the SIMerald Notion template (v1), in Chinese and English.
 *
 * `build.ts` renders this definition into `docs/notion-template/` and checks it against the
 * column presets in `server/mapping.ts`. When the template changes, edit this file first,
 * regenerate the docs, then apply the same change to the published Notion templates.
 *
 * Formulas that read properties of related pages (`current.prop(...)`: Valid Until and both
 * data checks) cannot be created through the Notion MCP tools; paste them in the Notion UI.
 */

import type { NotionColor } from '../../shared/types.ts'

export const TEMPLATE_VERSION = 'v1'

export type Lang = 'zh' | 'en'
export type Localized = Record<Lang, string>

export type DbKey = 'cards' | 'records' | 'accounts'

export type ColumnType
  = | 'title' | 'rich_text' | 'phone_number' | 'number' | 'select' | 'multi_select'
    | 'date' | 'formula' | 'rollup' | 'relation'

export interface SelectOption {
  key: string
  name: Localized
  color: NotionColor
}

export interface FormulaContext {
  lang: Lang
  /** Localized column name of `db.key`, ready to put inside `prop("…")` */
  col: (db: DbKey, key: string) => string
  /** `prop("<column>")` for a column of the database that owns the formula */
  p: (key: string) => string
  /** `current.prop("<column>")` for a column of a related database */
  cp: (db: DbKey, key: string) => string
  /** Localized option name as a quoted formula string literal */
  opt: (db: DbKey, key: string, option: string) => string
  /** Picks the string for the current language */
  t: (text: Localized) => string
  /** Quotes a localized message as a formula string literal */
  q: (text: Localized) => string
}

export interface Column {
  key: string
  name: Localized
  type: ColumnType
  description: Localized
  options?: SelectOption[]
  numberFormat?: 'number'
  /** Number of decimals shown for number columns */
  precision?: number
  formula?: (ctx: FormulaContext) => string
  rollup?: { relation: string, property: string, function: 'earliest_date' | 'sum' }
  relation?: { target: DbKey, dual: string, limit?: 1 }
}

export interface Database {
  key: DbKey
  icon: string
  name: Localized
  description: Localized
  columns: Column[]
}

const L = (zh: string, en: string): Localized => ({ zh, en })

// ===== Shared option lists =====

interface CountryRow { iso: string, flag: string, zh: string, en: string, callingCode: string, color: NotionColor }

/** Countries and regions offered in the "Country" select. The data check validates calling codes only for these. */
export const COUNTRIES: CountryRow[] = [
  { iso: 'CN', flag: '🇨🇳', zh: '中国', en: 'China', callingCode: '+86', color: 'red' },
  { iso: 'HK', flag: '🇭🇰', zh: '中国香港', en: 'Hong Kong', callingCode: '+852', color: 'orange' },
  { iso: 'MO', flag: '🇲🇴', zh: '中国澳门', en: 'Macao', callingCode: '+853', color: 'green' },
  { iso: 'TW', flag: '🇹🇼', zh: '中国台湾', en: 'Taiwan', callingCode: '+886', color: 'blue' },
  { iso: 'JP', flag: '🇯🇵', zh: '日本', en: 'Japan', callingCode: '+81', color: 'pink' },
  { iso: 'KR', flag: '🇰🇷', zh: '韩国', en: 'South Korea', callingCode: '+82', color: 'purple' },
  { iso: 'SG', flag: '🇸🇬', zh: '新加坡', en: 'Singapore', callingCode: '+65', color: 'red' },
  { iso: 'MY', flag: '🇲🇾', zh: '马来西亚', en: 'Malaysia', callingCode: '+60', color: 'yellow' },
  { iso: 'TH', flag: '🇹🇭', zh: '泰国', en: 'Thailand', callingCode: '+66', color: 'blue' },
  { iso: 'PH', flag: '🇵🇭', zh: '菲律宾', en: 'Philippines', callingCode: '+63', color: 'blue' },
  { iso: 'ID', flag: '🇮🇩', zh: '印度尼西亚', en: 'Indonesia', callingCode: '+62', color: 'red' },
  { iso: 'VN', flag: '🇻🇳', zh: '越南', en: 'Vietnam', callingCode: '+84', color: 'red' },
  { iso: 'LK', flag: '🇱🇰', zh: '斯里兰卡', en: 'Sri Lanka', callingCode: '+94', color: 'yellow' },
  { iso: 'AE', flag: '🇦🇪', zh: '阿联酋', en: 'UAE', callingCode: '+971', color: 'green' },
  { iso: 'TR', flag: '🇹🇷', zh: '土耳其', en: 'Turkey', callingCode: '+90', color: 'red' },
  { iso: 'GB', flag: '🇬🇧', zh: '英国', en: 'United Kingdom', callingCode: '+44', color: 'gray' },
  { iso: 'DE', flag: '🇩🇪', zh: '德国', en: 'Germany', callingCode: '+49', color: 'yellow' },
  { iso: 'FR', flag: '🇫🇷', zh: '法国', en: 'France', callingCode: '+33', color: 'blue' },
  { iso: 'NL', flag: '🇳🇱', zh: '荷兰', en: 'Netherlands', callingCode: '+31', color: 'orange' },
  { iso: 'ES', flag: '🇪🇸', zh: '西班牙', en: 'Spain', callingCode: '+34', color: 'yellow' },
  { iso: 'IT', flag: '🇮🇹', zh: '意大利', en: 'Italy', callingCode: '+39', color: 'green' },
  { iso: 'PL', flag: '🇵🇱', zh: '波兰', en: 'Poland', callingCode: '+48', color: 'red' },
  { iso: 'EE', flag: '🇪🇪', zh: '爱沙尼亚', en: 'Estonia', callingCode: '+372', color: 'purple' },
  { iso: 'CH', flag: '🇨🇭', zh: '瑞士', en: 'Switzerland', callingCode: '+41', color: 'red' },
  { iso: 'US', flag: '🇺🇸', zh: '美国', en: 'United States', callingCode: '+1', color: 'default' },
  { iso: 'CA', flag: '🇨🇦', zh: '加拿大', en: 'Canada', callingCode: '+1', color: 'red' },
  { iso: 'MX', flag: '🇲🇽', zh: '墨西哥', en: 'Mexico', callingCode: '+52', color: 'green' },
  { iso: 'BR', flag: '🇧🇷', zh: '巴西', en: 'Brazil', callingCode: '+55', color: 'green' },
  { iso: 'AU', flag: '🇦🇺', zh: '澳大利亚', en: 'Australia', callingCode: '+61', color: 'blue' },
  { iso: 'NZ', flag: '🇳🇿', zh: '新西兰', en: 'New Zealand', callingCode: '+64', color: 'green' },
]

interface CurrencyRow { code: string, symbol: string, color: NotionColor, /** Plausible range of "1 unit = ? CNY"; null for CNY */ range: [number, number] | null }

/** Currencies offered in the currency selects. Every code must be supported by `src/utils/financeHelper.ts`. */
export const CURRENCIES: CurrencyRow[] = [
  { code: 'CNY', symbol: '¥', color: 'red', range: null },
  { code: 'HKD', symbol: 'HK$', color: 'orange', range: [0.7, 1.1] },
  { code: 'MOP', symbol: 'MOP$', color: 'green', range: [0.65, 1.1] },
  { code: 'TWD', symbol: 'NT$', color: 'yellow', range: [0.15, 0.3] },
  { code: 'JPY', symbol: '¥', color: 'pink', range: [0.03, 0.07] },
  { code: 'KRW', symbol: '₩', color: 'brown', range: [0.003, 0.008] },
  { code: 'SGD', symbol: 'S$', color: 'green', range: [4.5, 6.5] },
  { code: 'MYR', symbol: 'RM', color: 'blue', range: [1.2, 2.1] },
  { code: 'THB', symbol: '฿', color: 'purple', range: [0.15, 0.3] },
  { code: 'PHP', symbol: '₱', color: 'green', range: [0.08, 0.16] },
  { code: 'IDR', symbol: 'Rp', color: 'red', range: [0.0003, 0.0006] },
  { code: 'VND', symbol: '₫', color: 'yellow', range: [0.0002, 0.0004] },
  { code: 'LKR', symbol: 'Rs', color: 'pink', range: [0.015, 0.035] },
  { code: 'AED', symbol: 'Dh', color: 'green', range: [1.5, 2.5] },
  { code: 'TRY', symbol: '₺', color: 'red', range: [0.08, 0.35] },
  { code: 'GBP', symbol: '£', color: 'gray', range: [7.5, 11.5] },
  { code: 'EUR', symbol: '€', color: 'blue', range: [6.5, 9.5] },
  { code: 'PLN', symbol: 'zł', color: 'red', range: [1.4, 2.5] },
  { code: 'CHF', symbol: 'Fr', color: 'red', range: [7, 10.5] },
  { code: 'USD', symbol: '$', color: 'default', range: [6, 8] },
  { code: 'CAD', symbol: 'C$', color: 'brown', range: [4, 6.2] },
  { code: 'MXN', symbol: 'Mex$', color: 'green', range: [0.28, 0.5] },
  { code: 'BRL', symbol: 'R$', color: 'yellow', range: [0.9, 1.8] },
  { code: 'AUD', symbol: 'A$', color: 'blue', range: [3.6, 5.6] },
  { code: 'NZD', symbol: 'NZ$', color: 'yellow', range: [3.3, 5.3] },
]

export function currencyOptionName(row: CurrencyRow): string {
  return `${row.code} ${row.symbol}`
}

const countryOptions: SelectOption[] = COUNTRIES.map(c => ({
  key: c.iso,
  name: L(`${c.flag} ${c.zh}`, `${c.flag} ${c.en}`),
  color: c.color,
}))

const currencyOptions: SelectOption[] = CURRENCIES.map(c => ({
  key: c.code,
  name: L(currencyOptionName(c), currencyOptionName(c)),
  color: c.color,
}))

const CNY_OPTION = currencyOptionName(CURRENCIES[0]!)

// ===== Formulas =====

const STATUS_TEXT = {
  active: L('使用中', 'Active'),
  expired: L('已过期', 'Expired'),
  cancelled: L('已注销', 'Cancelled'),
}

function joinSep(t: FormulaContext['t']): string {
  return t(L('；', '; '))
}

function expiresAtFormula({ p, cp, col, t }: FormulaContext) {
  return `lets(
  /* ${t(L('只看同时填了「本次有效期延至」和「消费日期」的记录', 'Only records with both "Extends To" and "Date" filled in'))} */
  valid, ${p('records')}.filter(!empty(${cp('records', 'extendsTo')}) and !empty(${cp('records', 'date')})),
  /* ${t(L('最近一次操作的日期', 'Date of the latest transaction'))} */
  latestDay, valid.map(timestamp(dateStart(${cp('records', 'date')}))).sort().last(),
  sameDay, valid.filter(timestamp(dateStart(${cp('records', 'date')})) == latestDay),
  /* ${t(L('同一天有多条时取最晚的延至日期', 'If several records share that date, take the latest "Extends To"'))} */
  latestExtends, sameDay.map(timestamp(dateStart(${cp('records', 'extendsTo')}))).sort().last(),
  if(empty(valid), parseDate(""),
    sameDay.find(timestamp(dateStart(${cp('records', 'extendsTo')})) == latestExtends).prop(${JSON.stringify(col('records', 'extendsTo'))}))
)`
}

function statusFormula({ p, q, t }: FormulaContext) {
  return `lets(
  expires, ${p('expiresAt')},
  /* ${t(L('填了停用日期 = 已注销；过了有效期 = 已过期；其余 = 使用中。and/or 不短路，所以日期判断用嵌套 if', 'Cancelled date set = cancelled; past "Valid Until" = expired; otherwise active. and/or do not short-circuit, so date checks use nested if'))} */
  if(!empty(${p('cancelledAt')}), ${q(STATUS_TEXT.cancelled)},
    if(empty(expires), ${q(STATUS_TEXT.active)},
      if(dateBetween(today(), expires, "days") >= 1, ${q(STATUS_TEXT.expired)}, ${q(STATUS_TEXT.active)})))
)`
}

function nextRenewalFormula({ p, q, t }: FormulaContext) {
  return `lets(
  expires, ${p('expiresAt')},
  /* ${t(L('只有已注销才留空；已过期仍显示本该续费的日期，方便补救', 'Empty only when cancelled; expired cards still show the date they should have been renewed'))} */
  if(${p('status')} == ${q(STATUS_TEXT.cancelled)} or empty(expires), parseDate(""),
    /* ${t(L('填了手动覆盖就以它为准，否则就是当前有效期至', 'Use the manual override when set, otherwise "Valid Until"'))} */
    if(!empty(${p('nextRenewalOverride')}), ${p('nextRenewalOverride')}, expires))
)`
}

function urgencyFormula({ p, q, t }: FormulaContext) {
  return `lets(
  status, ${p('status')},
  override, ${p('nextRenewalOverride')},
  /* ${t(L('目标续费日期：填了手动覆盖用它，否则用当前有效期至', 'Target renewal date: the manual override when set, otherwise "Valid Until"'))} */
  target, if(!empty(override), override, ${p('expiresAt')}),
  startDay, dateStart(target),
  endDay, dateEnd(target),
  /* ${t(L('按顺序互斥划分，命中即停', 'Mutually exclusive tiers, evaluated in order'))} */
  ifs(
    status == ${q(STATUS_TEXT.cancelled)}, ${q(L('⑨ 号码已失效', '⑨ Number cancelled'))},
    empty(target), ${q(L('⑧ 无续费日期', '⑧ No renewal date'))},
    status == ${q(STATUS_TEXT.expired)} or dateBetween(today(), endDay, "days") >= 1, ${q(L('① 已逾期', '① Overdue'))},
    dateBetween(endDay, startDay, "days") > 0 and dateBetween(today(), startDay, "days") >= 0,
      ${q(L('⓪ 续费窗口开放中（剩 ', '⓪ Renewal window open ('))} + format(dateBetween(endDay, today(), "days")) + ${q(L(' 天）', ' days left)'))},
    dateBetween(startDay, today(), "days") <= 3, ${q(L('② 未来 3 天内', '② Within 3 days'))},
    dateBetween(startDay, today(), "days") <= 7, ${q(L('③ 未来 7 天内', '③ Within 7 days'))},
    dateBetween(startDay, today(), "days") <= 15, ${q(L('④ 未来 15 天内', '④ Within 15 days'))},
    dateBetween(startDay, today(), "days") <= 30, ${q(L('⑤ 未来 30 天内', '⑤ Within 30 days'))},
    dateBetween(startDay, today(), "days") <= 60, ${q(L('⑥ 未来 60 天内', '⑥ Within 60 days'))},
    ${q(L('⑦ 超过 60 天', '⑦ More than 60 days'))}
  )
)`
}

function amountCNYFormula({ p, t }: FormulaContext) {
  return `if(
  empty(${p('amount')}),
  0,
  /* ${t(L('人民币直接取原值；外币必须填汇率，漏填时返回空值', 'CNY is taken as is; other currencies need a rate and stay empty without one'))} */
  if(
    ${p('currency')} == "${CNY_OPTION}",
    ${p('amount')},
    if(empty(${p('rate')}), toNumber(""), round(${p('amount')} * ${p('rate')} * 100) / 100)
  )
)`
}

function callingCodeIfs(ctx: FormulaContext): string {
  const rows = COUNTRIES.map(c => `test(country, "${ctx.lang === 'zh' ? c.zh : c.en}$"), "${c.callingCode}"`)
  return `ifs(${rows.join(', ')}, "")`
}

function rateRangeIfs(): string {
  const rows = CURRENCIES.filter(c => c.range).map(c => `currency == "${currencyOptionName(c)}", [${c.range![0]}, ${c.range![1]}]`)
  return `ifs(${rows.join(', ')}, [])`
}

function cardCheckFormula(ctx: FormulaContext) {
  const { p, cp, opt, q, t, col } = ctx
  const missingLabel = (key: string) => q(L(col('cards', key), col('cards', key)))
  return `lets(
  status, ${p('status')},
  inactive, status == ${q(STATUS_TEXT.expired)} or status == ${q(STATUS_TEXT.cancelled)},
  expires, ${p('expiresAt')},
  override, ${p('nextRenewalOverride')},
  balanceDay, ${p('balanceUpdatedAt')},
  actions, ${p('keepAlive')},
  /* ${t(L('靠余额保号：选了「有效使用」或「产生余额变动」。改了这两个选项名时要同步改这里', 'Balance-based keep-alive: "Regular use" or "Balance change" is selected. Update this line if you rename those options'))} */
  needsBalance, actions.includes(${opt('cards', 'keepAlive', 'use')}) or actions.includes(${opt('cards', 'keepAlive', 'balanceChange')}),
  number, replaceAll(format(${p('number')}), " ", ""),
  country, format(${p('country')}),
  kind, format(${p('type')}),
  /* ${t(L('消费记录的日期一律转成时间戳再比较；先滤掉没填日期的记录', 'Record dates are compared as timestamps; records without a date are filtered out first'))} */
  dated, ${p('records')}.filter(!empty(${cp('records', 'date')})),
  purchases, ${p('records')}.filter(format(${cp('records', 'type')}) == ${opt('records', 'type', 'purchase')}).length(),
  purchaseDay, dated.filter(format(${cp('records', 'type')}) == ${opt('records', 'type', 'purchase')}).map(timestamp(dateStart(${cp('records', 'date')}))).sort().first(),
  earliestDay, dated.map(timestamp(dateStart(${cp('records', 'date')}))).sort().first(),
  lastRenewalDay, dated.filter(!empty(${cp('records', 'extendsTo')})).map(timestamp(dateStart(${cp('records', 'date')}))).sort().last(),
  missing, [
    if(empty(${p('country')}), ${missingLabel('country')}, ""),
    if(empty(${p('type')}), ${missingLabel('type')}, ""),
    /* ${t(L('虚拟号码只在 App 里收短信，不需要设备', 'Virtual numbers live in an app and need no device'))} */
    if(kind != ${opt('cards', 'type', 'virtual')} and empty(${p('device')}), ${missingLabel('device')}, ""),
    if(empty(actions), ${missingLabel('keepAlive')}, ""),
    if(empty(${p('cycle')}), ${missingLabel('cycle')}, "")
  ].filter(current != "").join(${q(L('、', ', '))}),
  /* ${t(L('号码国家对应的区号；不在列表里的国家直接跳过，不做检查', 'Calling code of the country; countries not listed here are skipped'))} */
  callingCode, ${callingCodeIfs(ctx)},
  /* ${t(L('注意：Notion 的 and/or 不短路，日期为空时不能直接做日期运算，所以日期判断都用嵌套 if', 'Note: Notion and/or do not short-circuit, so date checks use nested if to avoid empty dates'))} */
  [
    if(empty(number), ${q(L('缺号码', 'Number is missing'))},
      if(!test(number, "^[+][0-9]+$"), ${q(L('号码应为 +国家码 格式（只含数字）', 'Number should be in +country-code format (digits only)'))},
        if(!${p('name')}.contains(number.substring(number.length() - 4)), ${q(L('标题未带号码后 4 位', 'Card name does not contain the last 4 digits'))}, ""))),
    if(empty(number) or callingCode == "", "",
      if(number.substring(0, callingCode.length()) != callingCode, ${q(L('号码与号码国家不符（应以 ', 'Number does not match the country (should start with '))} + callingCode + ${q(L(' 开头）', ')'))}, "")),
    if(!inactive and missing != "", ${q(L('缺必填项：', 'Missing required fields: '))} + missing, ""),
    if(status == ${q(STATUS_TEXT.expired)}, ${q(L('已过期：续了就补一条续费记录，没续就填停用日期', 'Expired: add a renewal record if you renewed, otherwise fill in the cancelled date'))}, ""),
    /* ${t(L('号码失效后可能被回收，绑定的账号有被接管的风险', 'A dead number may be reassigned, putting linked accounts at risk'))} */
    if(inactive and !empty(${p('services')}), ${q(L('号码已失效但仍绑定：', 'Number is no longer active but still linked to: '))} + format(${p('services')}), ""),
    if(!inactive and empty(expires), ${q(L('没有任何消费记录填写「本次有效期延至」（首购也要填）', 'No expense record has "Extends To" (the initial purchase needs it too)'))}, ""),
    if(purchases != 1, ${q(L('首购记录应为 1 条（当前 ', 'There should be exactly 1 initial purchase record (currently '))} + format(purchases) + ${q(L(' 条）', ')'))}, ""),
    if(empty(purchaseDay) or empty(earliestDay), "",
      if(earliestDay < purchaseDay, ${q(L('有消费记录早于首购记录，请核对日期或消费类型', 'A record is dated before the initial purchase; check its date or type'))}, "")),
    if(empty(override) or empty(expires), "",
      if(dateBetween(dateEnd(override), expires, "days") > 0, ${q(L('手动覆盖的续费日期晚于当前有效期至', 'The override renewal date is after "Valid Until"'))}, "")),
    if(empty(override) or empty(lastRenewalDay), "",
      if(timestamp(dateStart(override)) < lastRenewalDay, ${q(L('手动覆盖的续费日期早于最近一次续费，已过时，请清空或更新', 'The override renewal date is older than the latest renewal; clear or update it'))}, "")),
    if(!inactive and ${p('price')} > 0 and empty(${p('paymentAccounts')}), ${q(L('续费要花钱但缺默认扣款账户', 'Renewal costs money but no default payment account is set'))}, ""),
    if((format(${p('price')}) == "") != empty(${p('currency')}), ${q(L('续费金额和续费币种只填了一个', 'Only one of renewal price and renewal currency is filled in'))}, ""),
    /* ${t(L('余额：0 元是有效值，所以用 format() 判断是否没填', 'Balance: 0 is a valid value, so format() is used to detect an empty field'))} */
    if(inactive or !needsBalance, "", if(format(${p('balance')}) == "", ${q(L('靠余额保号但缺当前余额', 'Kept alive by balance but the balance is missing'))},
      if(${p('balance')} <= 0, ${q(L('余额为 0，无法靠余额保号', 'Balance is 0, so it cannot keep the number alive'))}, ""))),
    if(inactive or !needsBalance, "",
      if(empty(balanceDay), ${q(L('靠余额保号但缺余额更新日期', 'Kept alive by balance but the balance date is missing'))},
        if(dateBetween(today(), dateStart(balanceDay), "days") > 90, ${q(L('余额超 90 天未更新，请核对', 'Balance not checked for over 90 days'))}, "")))
  ].filter(current != "").join("${joinSep(t)}")
)`
}

function recordCheckFormula(ctx: FormulaContext) {
  const { p, cp, opt, q, t } = ctx
  return `lets(
  amountText, format(${p('amount')}),
  day, ${p('date')},
  currency, format(${p('currency')}),
  kind, format(${p('type')}),
  rate, ${p('rate')},
  extendsTo, ${p('extendsTo')},
  hasCard, !empty(${p('card')}),
  /* ${t(L('关联卡的字段用 map 读，没关联卡时得到空值而不是出错', 'Read the linked card via map so a missing card yields empty values instead of an error'))} */
  cardDigits, replaceAll(${p('card')}.map(format(${cp('cards', 'number')})).join(""), "[^0-9]", ""),
  cycleDays, toNumber(replaceAll(${p('card')}.map(format(${cp('cards', 'cycle')})).join(""), "[^0-9]", "")),
  /* ${t(L('各货币「1 外币 = ? 人民币」的合理范围；不在列表里的货币直接跳过', 'Plausible "1 unit = ? CNY" ranges; currencies not listed here are skipped'))} */
  range, ${rateRangeIfs()},
  /* ${t(L('注意：empty(0) 为真，所以用 format() 区分「没填」和「填了 0」', 'Note: empty(0) is true, so format() tells "empty" from "0"'))} */
  [
    if(!hasCard, ${q(L('未关联 SIM 卡', 'Not linked to a SIM card'))}, ""),
    if(empty(day), ${q(L('缺消费日期', 'Date is missing'))},
      if(dateBetween(dateStart(day), today(), "days") > 0, ${q(L('消费日期在未来', 'Date is in the future'))}, "")),
    if(kind == "", ${q(L('缺消费类型', 'Type is missing'))}, ""),
    if(currency == "", ${q(L('缺货币', 'Currency is missing'))}, ""),
    if(amountText == "", ${q(L('缺支付金额（0 元请填 0）', 'Amount is missing (enter 0 for free)'))}, ""),
    if(currency != "" and currency != "${CNY_OPTION}" and ${p('amount')} > 0 and empty(rate), ${q(L('外币缺汇率', 'Foreign currency without a rate'))}, ""),
    /* ${t(L('汇率填反（如把 0.043 填成 23）会让金额差几十倍', 'An inverted rate (e.g. 23 instead of 0.043) makes the CNY amount wrong by orders of magnitude'))} */
    if(currency == "" or currency == "${CNY_OPTION}" or empty(rate) or empty(range), "",
      if(rate < range.at(0) or rate > range.at(1), ${q(L('汇率 ', 'Rate '))} + format(rate) + ${q(L(' 超出 ', ' is outside the usual range for '))} + currency + ${q(L(' 的合理范围（', ' ('))} + format(range.at(0)) + "–" + format(range.at(1)) + ${q(L('），是否填反了？', '); is it inverted?'))}, "")),
    /* ${t(L('标题里的号码后 4 位要和关联卡一致', 'The last 4 digits in the title should match the linked card'))} */
    if(cardDigits.length() < 4, "",
      if(!${p('title')}.contains(cardDigits.substring(cardDigits.length() - 4)), ${q(L('标题与关联卡的号码后 4 位不一致，是否选错了卡？', 'Title does not match the linked card\'s last 4 digits; wrong card?'))}, "")),
    /* ${t(L('首购和续费/保号必填「本次有效期延至」；额外充值和其他费用不该填；且必须晚于消费日期', '"Extends To" is required for initial purchases and renewals, not allowed for top-ups and other fees, and must be after the date'))} */
    if((kind == ${opt('records', 'type', 'purchase')} or kind == ${opt('records', 'type', 'renewal')}) and empty(extendsTo), ${q(L('「', '"'))} + kind + ${q(L('」记录缺「本次有效期延至」', '" record is missing "Extends To"'))}, ""),
    if(!empty(extendsTo) and (kind == ${opt('records', 'type', 'topup')} or kind == ${opt('records', 'type', 'other')}), ${q(L('「', '"'))} + kind + ${q(L('」不影响有效期，不应填「本次有效期延至」', '" does not extend validity; leave "Extends To" empty'))}, ""),
    if(empty(extendsTo) or empty(day), "",
      if(dateBetween(dateStart(extendsTo), dateStart(day), "days") <= 0, ${q(L('「本次有效期延至」应晚于消费日期', '"Extends To" should be after the date'))}, "")),
    /* ${t(L('有效期跨度：续费/保号不超过「续费周期 + 30 天」（周期不固定按 400 天）；首购只拦超过 1830 天（约 5 年）的年份笔误', 'Validity span: renewals at most "cycle + 30 days" (400 when irregular); initial purchases only catch year typos beyond 1830 days'))} */
    if(empty(extendsTo) or empty(day) or !hasCard, "",
      lets(
        limit, if(kind == ${opt('records', 'type', 'purchase')}, 1830, if(empty(cycleDays), 400, cycleDays + 30)),
        if(dateBetween(dateStart(extendsTo), dateStart(day), "days") > limit, ${q(L('有效期跨度超过 ', 'Validity span exceeds '))} + format(limit) + ${q(L(' 天，请核对年份', ' days; check the year'))}, ""))),
    if(${p('amount')} > 0 and empty(${p('accounts')}), ${q(L('付了钱但缺扣款账户', 'Paid but no payment account'))}, "")
  ].filter(current != "").join("${joinSep(t)}")
)`
}

// ===== Databases =====

export const DATABASES: Database[] = [
  {
    key: 'cards',
    icon: '📱',
    name: L('SIM 卡', 'SIM Cards'),
    description: L('每张 SIM / eSIM 卡占一行', 'One row per SIM or eSIM card'),
    columns: [
      { key: 'name', name: L('卡片名称', 'Card Name'), type: 'title', description: L('写法：运营商简称 · 号码后 4 位，如 Harbour Mobile · 0123（数据检查会校验后 4 位）。', 'Format: carrier · last 4 digits, e.g. Harbour Mobile · 0123 (verified by data check).') },
      { key: 'number', name: L('号码', 'Number'), type: 'phone_number', description: L('请按 E.164 国际格式填写完整号码，如 +85255550123。', 'Full phone number in E.164 international format, e.g. +85255550123.') },
      { key: 'country', name: L('号码国家', 'Country'), type: 'select', options: countryOptions, description: L('格式为“国旗 emoji + 空格 + 名称”，新增国家也请照此填写，SIMerald 靠国旗定位卡片。', 'Format: flag emoji + space + name; keep this for new countries as SIMerald locates cards by flag.') },
      {
        key: 'type',
        name: L('卡片类型', 'Card Type'),
        type: 'select',
        description: L('SIMerald 会按选项名称中的关键词自动判断大类：实体 / eSIM / 卡托 / 虚拟。', 'SIMerald detects the category from keywords in the name: Physical / eSIM / Adapter / Virtual.'),
        options: [
          { key: 'physical', name: L('实体 SIM', 'Physical SIM'), color: 'brown' },
          { key: 'embedded', name: L('eSIM · 直写手机', 'eSIM · Built-in'), color: 'blue' },
          { key: 'adapter', name: L('eSIM · 卡托', 'eSIM · Adapter'), color: 'purple' },
          { key: 'virtual', name: L('虚拟号码（仅 App）', 'Virtual Number (App only)'), color: 'gray' },
        ],
      },
      {
        key: 'device',
        name: L('主要使用设备', 'Device'),
        type: 'select',
        description: L('这张卡日常装在哪台设备里使用（仅站长可见）。', 'The device where this card is usually installed (owner only).'),
        options: [
          { key: 'main', name: L('主力机', 'Main Phone'), color: 'blue' },
          { key: 'backup', name: L('备用机', 'Backup Phone'), color: 'green' },
          { key: 'adapter', name: L('卡托', 'Adapter'), color: 'purple' },
          { key: 'none', name: L('未装机', 'Not Installed'), color: 'gray' },
        ],
      },
      {
        key: 'keepAlive',
        name: L('保号动作', 'Keep-alive Actions'),
        type: 'multi_select',
        description: L('让号码保持有效需要执行的操作，可多选。', 'Actions required to keep the number active; select one or more.'),
        options: [
          { key: 'topup', name: L('充值余额', 'Top up balance'), color: 'blue' },
          { key: 'addon', name: L('购买/启用增值服务', 'Buy or enable an add-on'), color: 'purple' },
          { key: 'use', name: L('有效使用（含收发短信）', 'Regular use (incl. SMS)'), color: 'green' },
          { key: 'balanceChange', name: L('产生余额变动（如发漫游短信）', 'Balance change (e.g. roaming SMS)'), color: 'yellow' },
          { key: 'autoCharge', name: L('自动扣费', 'Auto-charge'), color: 'orange' },
          { key: 'plan', name: L('购买续费套餐', 'Buy a renewal plan'), color: 'pink' },
        ],
      },
      {
        key: 'cycle',
        name: L('续费周期', 'Renewal Cycle'),
        type: 'select',
        description: L('两次续费之间的大致间隔天数，SIMerald 会提取选项名称里的第一个数字。', 'Approximate days between renewals; SIMerald reads the first number in the option name.'),
        options: [
          { key: '30', name: L('每 30 天', 'Every 30 days'), color: 'pink' },
          { key: '90', name: L('每 90 天', 'Every 90 days'), color: 'purple' },
          { key: '180', name: L('每 180 天', 'Every 180 days'), color: 'blue' },
          { key: '365', name: L('每 365 天', 'Every 365 days'), color: 'orange' },
          { key: 'varies', name: L('不固定（取决于充值/服务组合）', 'Varies (depends on top-ups or add-ons)'), color: 'default' },
        ],
      },
      { key: 'price', name: L('续费金额', 'Renewal Price'), type: 'number', numberFormat: 'number', description: L('每次续费或保号的费用，币种见「续费币种」；免费保号请填 0。', 'Cost per renewal in "Renewal Currency"; enter 0 if keeping the number is free.') },
      { key: 'currency', name: L('续费币种', 'Renewal Currency'), type: 'select', options: currencyOptions, description: L('计算「续费金额」与「当前余额」所用的货币。', 'The currency used for "Renewal Price" and "Balance".') },
      { key: 'balance', name: L('当前余额', 'Balance'), type: 'number', numberFormat: 'number', description: L('卡片当前的账户余额，币种同「续费币种」（仅站长可见）。', 'Current carrier balance in "Renewal Currency" (owner only).') },
      { key: 'balanceUpdatedAt', name: L('余额更新日期', 'Balance Checked'), type: 'date', description: L('最近一次核对余额的日期；靠余额保号的卡若超过 90 天未更新会被数据检查提示。', 'Date you last checked the balance; balance-kept cards are flagged after 90 days.') },
      { key: 'records', name: L('消费记录', 'Expense Records'), type: 'relation', relation: { target: 'records', dual: 'card' }, description: L('关联这张卡的历次消费（含首购与续费），在「消费记录」库新建后会自动显示在此。', 'All transactions for this card; rows added in "Expense Records" appear here automatically.') },
      { key: 'expiresAt', name: L('当前有效期至', 'Valid Until'), type: 'formula', formula: expiresAtFormula, description: L('自动：取按消费日期排序最近一条记录的「本次有效期延至」（同日多条取最晚），请勿手填。', 'Automatic: "Extends To" of the latest record by date (latest wins on ties); do not edit.') },
      { key: 'status', name: L('号码状态', 'Status'), type: 'formula', formula: statusFormula, description: L('自动：填了「停用日期」为已注销，过了「当前有效期至」为已过期，其余为使用中。', 'Automatic: Cancelled if "Cancelled On" is set, Expired if past "Valid Until", otherwise Active.') },
      { key: 'nextRenewalOverride', name: L('下次续费日期（手动覆盖）', 'Next Renewal Override'), type: 'date', description: L('仅当最佳续费日不是到期日当天时填写（如续费窗口、优惠截止，支持日期范围），续费后请清空或更新。', 'Set a date or range only when renewing on a day other than expiry (window or promo); clear after renewing.') },
      { key: 'nextRenewal', name: L('下次续费日期', 'Next Renewal'), type: 'formula', formula: nextRenewalFormula, description: L('自动：优先采用「下次续费日期（手动覆盖）」，未填则等于「当前有效期至」，已注销后为空。', 'Automatic: uses "Next Renewal Override" when set, otherwise "Valid Until", or empty once cancelled.') },
      { key: 'cancelledAt', name: L('停用日期', 'Cancelled On'), type: 'date', description: L('号码正式注销或放弃的日期，填写后状态会自动变为已注销。', 'Date the number was cancelled or abandoned; automatically sets status to Cancelled.') },
      { key: 'firstPurchaseAt', name: L('首次购买日期', 'First Purchase'), type: 'rollup', rollup: { relation: 'records', property: 'date', function: 'earliest_date' }, description: L('自动：汇总关联消费记录中最早一笔的日期。', 'Automatic: the earliest transaction date among linked expense records.') },
      { key: 'totalSpentCNY', name: L('卡消费合计 CNY', 'Total Spent CNY'), type: 'rollup', rollup: { relation: 'records', property: 'amountCNY', function: 'sum' }, description: L('自动：这张卡所有关联消费记录的等额人民币总和。', 'Automatic: total CNY equivalent across all linked expense records.') },
      { key: 'urgency', name: L('续费紧急度', 'Urgency'), type: 'formula', formula: urgencyFormula, description: L('自动：按续费紧迫程度分档（⑨ 已注销；⑧ 无日期；① 已逾期；⓪ 在续费窗口内；②~⑦ 按剩余天数）。', 'Automatic: urgency tier (⑨ cancelled, ⑧ no date, ① overdue, ⓪ window open, ②–⑦ by days left).') },
      {
        key: 'services',
        name: L('绑定的服务', 'Linked Services'),
        type: 'multi_select',
        description: L('绑定或注册过该号码的网站与服务，停用号码前请先完成换绑（仅站长可见）。', 'Services registered or verified with this number; migrate them before cancelling (owner only).'),
        options: [
          { key: 'telegram', name: L('Telegram', 'Telegram'), color: 'blue' },
          { key: 'whatsapp', name: L('WhatsApp', 'WhatsApp'), color: 'green' },
          { key: 'signal', name: L('Signal', 'Signal'), color: 'purple' },
          { key: 'apple', name: L('Apple ID', 'Apple ID'), color: 'default' },
          { key: 'google', name: L('Google', 'Google'), color: 'yellow' },
          { key: 'bank', name: L('银行/支付', 'Bank / Payment'), color: 'brown' },
          { key: 'other', name: L('其他', 'Other'), color: 'gray' },
        ],
      },
      { key: 'account', name: L('管理账号', 'Account Login'), type: 'rich_text', description: L('登录运营商官方 App 或网站所用的账号（仅站长可见）。', 'Login identifier for the carrier\'s app or website (owner only).') },
      { key: 'paymentAccounts', name: L('默认扣款账户', 'Default Payment Account'), type: 'relation', relation: { target: 'accounts', dual: 'cards' }, description: L('这张卡日常续费默认使用的付款账户（仅站长可见）。', 'The account that normally pays for this card\'s renewals (owner only).') },
      { key: 'dataCheck', name: L('⚠️ 数据检查', '⚠️ Data Check'), type: 'formula', formula: cardCheckFormula, description: L('自动：检测到漏填或数据不一致时显示修正提示，为空代表一切正常。', 'Automatic: displays warnings when data is missing or inconsistent; empty means all good.') },
    ],
  },
  {
    key: 'records',
    icon: '💰',
    name: L('消费记录', 'Expense Records'),
    description: L('首购、续费、充值等每笔消费占一行', 'One row per purchase, renewal, top-up or other fee'),
    columns: [
      { key: 'title', name: L('记录', 'Record'), type: 'title', description: L('写法：卡片名称 · 类型 · 日期，如 Harbour Mobile · 0123 · 首购 · 2026-10-01（仅站长可见）。', 'Format: card name · type · date, e.g. Harbour Mobile · 0123 · Purchase · 2026-10-01 (owner only).') },
      { key: 'card', name: L('SIM 卡', 'SIM Card'), type: 'relation', relation: { target: 'cards', dual: 'records', limit: 1 }, description: L('这笔消费记录所对应的号码卡片。', 'The SIM card this transaction belongs to.') },
      {
        key: 'type',
        name: L('消费类型', 'Type'),
        type: 'select',
        description: L('首次购买/开卡与续费/保号会更新卡片有效期，额外充值与其他费用仅作记账。', 'Initial purchase and Renewal update card validity; Extra top-up and Other fee are for bookkeeping only.'),
        options: [
          { key: 'purchase', name: L('首次购买/开卡', 'Initial purchase'), color: 'purple' },
          { key: 'renewal', name: L('续费/保号', 'Renewal'), color: 'blue' },
          { key: 'topup', name: L('额外充值', 'Extra top-up'), color: 'green' },
          { key: 'other', name: L('其他费用', 'Other fee'), color: 'gray' },
        ],
      },
      { key: 'date', name: L('消费日期', 'Date'), type: 'date', description: L('实际付款购买或完成保号操作的日期。', 'The date you actually paid or completed the keep-alive action.') },
      { key: 'amount', name: L('支付金额', 'Amount'), type: 'number', numberFormat: 'number', description: L('按实际扣款币种填写的原始金额，免费保号请填 0。', 'Original amount in the charged currency; enter 0 for free keep-alive actions.') },
      { key: 'currency', name: L('货币', 'Currency'), type: 'select', options: currencyOptions, description: L('填写「支付金额」所使用的币种。', 'The currency used for "Amount".') },
      { key: 'rate', name: L('当时汇率', 'Rate to CNY'), type: 'number', precision: 4, description: L('1 单位该外币折合多少人民币；币种本身为人民币时请留空。', 'How many CNY equal 1 unit of this currency; leave empty when paying in CNY.') },
      { key: 'amountCNY', name: L('等额 CNY', 'Amount CNY'), type: 'formula', formula: amountCNYFormula, description: L('自动：由「支付金额」乘以「当时汇率」算出，外币未填汇率时为空。', 'Automatic: "Amount" multiplied by "Rate to CNY"; empty if a foreign currency has no rate.') },
      { key: 'extendsTo', name: L('本次有效期延至', 'Extends To'), type: 'date', description: L('本次操作后号码的新到期日；首次购买/开卡和续费/保号必填，额外充值和其他费用留空。', 'New expiry date after this action; required for purchases and renewals, leave empty for top-ups and fees.') },
      { key: 'accounts', name: L('扣款账户', 'Payment Account'), type: 'relation', relation: { target: 'accounts', dual: 'records' }, description: L('这笔消费实际出钱付款的账户（仅站长可见）。', 'The payment account that actually funded this transaction (owner only).') },
      { key: 'dataCheck', name: L('⚠️ 数据检查', '⚠️ Data Check'), type: 'formula', formula: recordCheckFormula, description: L('自动：检测到漏填或数据不一致时显示修正提示，为空代表一切正常。', 'Automatic: displays warnings when data is missing or inconsistent; empty means all good.') },
    ],
  },
  {
    key: 'accounts',
    icon: '💳',
    name: L('支付账户', 'Payment Accounts'),
    description: L('付续费用的银行卡、钱包等；只有站长登录后才能看到账户名称', 'Cards and wallets used to pay; account names are visible to the owner only'),
    columns: [
      { key: 'name', name: L('账户名称', 'Account Name'), type: 'title', description: L('建议写法：平台名称 · 尾号，如 示例银行 · 4242。', 'Suggested format: provider · last digits, e.g. Example Bank · 4242.') },
      {
        key: 'type',
        name: L('账户类型', 'Account Type'),
        type: 'select',
        description: L('该支付账户所属的资金渠道类型。', 'The category of this funding source.'),
        options: [
          { key: 'bank', name: L('银行卡', 'Bank card'), color: 'green' },
          { key: 'virtual', name: L('虚拟卡', 'Virtual card'), color: 'blue' },
          { key: 'alipay', name: L('支付宝', 'Alipay'), color: 'blue' },
          { key: 'wechat', name: L('微信支付', 'WeChat Pay'), color: 'green' },
          { key: 'paypal', name: L('PayPal', 'PayPal'), color: 'purple' },
          { key: 'balance', name: L('平台余额', 'Platform balance'), color: 'gray' },
          { key: 'other', name: L('其他', 'Other'), color: 'default' },
        ],
      },
      {
        key: 'status',
        name: L('状态', 'Status'),
        type: 'select',
        description: L('账户当前能否正常扣款；遇到余额不足、冻结或销户时请及时更新。', 'Whether the account is ready to pay; update promptly if low on funds, frozen, or closed.'),
        options: [
          { key: 'ok', name: L('正常', 'Active'), color: 'green' },
          { key: 'low', name: L('余额不足', 'Low balance'), color: 'orange' },
          { key: 'frozen', name: L('已冻结', 'Frozen'), color: 'red' },
          { key: 'closed', name: L('已注销', 'Closed'), color: 'gray' },
        ],
      },
      { key: 'cards', name: L('SIM 卡', 'SIM Cards'), type: 'relation', relation: { target: 'cards', dual: 'paymentAccounts' }, description: L('将此账户设为「默认扣款账户」的所有卡片。', 'Cards that use this account as their "Default Payment Account".') },
      { key: 'records', name: L('消费记录', 'Expense Records'), type: 'relation', relation: { target: 'records', dual: 'accounts' }, description: L('历次使用此账户实际付款的消费记录。', 'All expense records paid with this account.') },
    ],
  },
]

// ===== Sample rows (marked with the 🧪 page icon) =====

export interface SampleAccount { key: string, name: Localized, type: string, status: string }
export interface SampleRecord { type: string, date: string, amount: number, currency: string, rate: number | null, extendsTo: string | null, account: string | null }
export interface SampleCard {
  carrier: string
  number: string
  country: string
  type: string
  device: string | null
  keepAlive: string[]
  cycle: string
  price: number
  currency: string
  balance: number | null
  balanceUpdatedAt: string | null
  cancelledAt: string | null
  services: string[]
  account: string | null
  paymentAccount: string | null
  records: SampleRecord[]
}

export const SAMPLE_ICON = '🧪'

export const SAMPLE_ACCOUNTS: SampleAccount[] = [
  { key: 'card', name: L('示例银行 · 4242', 'Example Bank · 4242'), type: 'bank', status: 'ok' },
  { key: 'paypal', name: L('示例 PayPal', 'Example PayPal'), type: 'paypal', status: 'ok' },
]

/** Three typical cards: paid yearly and active, free and kept alive by usage, cancelled. Carriers and numbers are fictional. */
export const SAMPLE_CARDS: SampleCard[] = [
  {
    carrier: 'Harbour Mobile',
    number: '+85255550123',
    country: 'HK',
    type: 'physical',
    device: 'main',
    keepAlive: ['topup'],
    cycle: '365',
    price: 18,
    currency: 'HKD',
    balance: null,
    balanceUpdatedAt: null,
    cancelledAt: null,
    services: ['telegram', 'whatsapp'],
    account: 'demo@example.com',
    paymentAccount: 'card',
    records: [
      // A 3-year starter pack keeps the sample active for a long time
      { type: 'purchase', date: '2026-10-01', amount: 128, currency: 'HKD', rate: 0.92, extendsTo: '2029-09-30', account: 'card' },
    ],
  },
  {
    carrier: 'Fjord Telecom',
    number: '+3725555012',
    country: 'EE',
    type: 'adapter',
    device: 'adapter',
    keepAlive: ['use'],
    cycle: '365',
    price: 0,
    currency: 'EUR',
    balance: 1,
    balanceUpdatedAt: '2026-10-15',
    cancelledAt: null,
    services: ['signal'],
    account: null,
    paymentAccount: null,
    records: [
      { type: 'purchase', date: '2025-12-01', amount: 4.5, currency: 'EUR', rate: 7.9, extendsTo: '2026-12-01', account: 'paypal' },
      { type: 'renewal', date: '2026-10-15', amount: 0, currency: 'EUR', rate: null, extendsTo: '2027-10-15', account: null },
    ],
  },
  {
    carrier: 'Kiwi Wireless',
    number: '+64215550166',
    country: 'NZ',
    type: 'physical',
    device: 'none',
    keepAlive: ['topup'],
    cycle: '365',
    price: 10,
    currency: 'NZD',
    balance: null,
    balanceUpdatedAt: null,
    cancelledAt: '2026-07-20',
    services: [],
    account: null,
    paymentAccount: 'paypal',
    records: [
      { type: 'purchase', date: '2024-08-01', amount: 20, currency: 'NZD', rate: 4.3, extendsTo: '2025-08-01', account: 'paypal' },
      { type: 'renewal', date: '2025-07-25', amount: 10, currency: 'NZD', rate: 4.3, extendsTo: '2026-08-01', account: 'paypal' },
    ],
  },
]

/** Short record type labels used in sample record titles */
export const RECORD_TITLE_TYPE: Record<string, Localized> = {
  purchase: L('首购', 'Purchase'),
  renewal: L('续费', 'Renewal'),
  topup: L('充值', 'Top-up'),
  other: L('其他', 'Other'),
}

// ===== Template page =====

const REPO_URL = 'https://github.com/BurningSky0306/simerald'

/** Setup tutorial linked from the template page */
export const SETUP_URL: Localized = {
  zh: `${REPO_URL}/blob/main/docs/notion-setup.zh-CN.md`,
  en: `${REPO_URL}/blob/main/docs/notion-setup.md`,
}

/** Usage guide at the top of the template page (Notion-flavored Markdown) */
export const GUIDE: Localized = {
  zh: `### 使用说明
- **这是什么**：SIMerald 官方 Notion 模板 ${TEMPLATE_VERSION}，可单独用作 SIM/eSIM 续费管理工具，也可配合 SIMerald 生成公开卡片墙（[配置教程](${SETUP_URL.zh})）。
- **首次使用**：带 🧪 图标的条目均为虚构示例，参考写法后请将示例卡片、记录和支付账户全部删除。
- **日常查看**：平时看「📊 续费一览」；当「⚠️ 数据检查」列出现提示时，按文字修正。
- **新增卡片**：在「SIM 卡」库新建一行，填好身份信息（名称格式“运营商 · 后 4 位”、+国家码格式号码、国家、卡片类型、设备）、保号动作、续费周期/金额/币种与「默认扣款账户」；再在该卡的「消费记录」库新增一条「首次购买/开卡」记录（日期为拿卡日），填好「本次有效期延至」与「扣款账户」。备注、教程、实名信息写在卡片正文。
- **续费/保号**：只需在「消费记录」库新增一条「续费/保号」记录并填好「本次有效期延至」和「扣款账户」，卡片的「当前有效期至」、「下次续费日期」与「号码状态」会自动更新，无需改卡。
- **其他支出**：同样新增「消费记录」，类型选「额外充值」或「其他费用」，「本次有效期延至」留空。消耗话费余额不算新消费，往余额充值才算，需填实际出钱的「扣款账户」。
- **特殊续费日**：若最佳续费时机不是到期日当天（如续费窗口、优惠截止），填写「下次续费日期（手动覆盖）」（可填单日或日期范围），续费后清空。
- **停用号码**：先迁走绑定的服务，再填「停用日期」（「号码状态」会自动变为已注销），停用原因写在卡片正文，不要删卡。
- **国家与币种**：新增国家须保持“国旗 emoji + 空格 + 名称”格式；「⚠️ 数据检查」仅校验模板内置国家/币种的区号与汇率范围，其余会自动跳过。
- **请勿改列名**：SIMerald 与公式按列名读取数据（若必须改名，请参考教程的自定义映射章节）。`,
  en: `### How to Use
- **What this is**: The official SIMerald Notion template ${TEMPLATE_VERSION}. Use it standalone as a SIM/eSIM renewal tracker, or pair it with SIMerald to publish a public card wall ([Setup Tutorial](${SETUP_URL.en})).
- **First steps**: Rows marked with 🧪 are fictional samples. Check them to see how things work, then delete all sample cards, records, and payment accounts.
- **Daily use**: Check "📊 Renewals"; whenever "⚠️ Data Check" shows a message, fix what it says.
- **New card**: Create a row in "SIM Cards" and fill in identity info (name as "Carrier · last 4 digits", number with +country-code, country, card type, device), keep-alive actions, renewal cycle/price/currency, and "Default Payment Account". Then add an "Initial purchase" row in that card's "Expense Records" (Date = day you got the card) with "Extends To" and "Payment Account". Put notes, guides, and KYC info in the card page body.
- **Renewal / keep-alive**: Just add one "Renewal" record in "Expense Records" with "Extends To" and "Payment Account"—the card's "Valid Until", "Next Renewal", and "Status" update automatically without editing the card.
- **Other spending**: Add a record in "Expense Records" of type "Extra top-up" or "Other fee" and leave "Extends To" empty. Spending carrier balance isn't a new expense; topping it up is, using the "Payment Account" that actually paid.
- **Special renewal day**: If you should renew before the expiry day (renewal window or promo deadline), set "Next Renewal Override" (a date or range), then clear it after renewing.
- **Cancelling**: Move linked services away first, then fill "Cancelled On" ("Status" becomes Cancelled automatically) and note the reason in the card page body—don't delete the card.
- **Countries & currencies**: New countries must follow "flag emoji + space + name"; "⚠️ Data Check" only checks calling codes and exchange-rate ranges for built-in countries/currencies and silently skips others.
- **Do not rename columns**: SIMerald and formulas look up columns by name (see the tutorial's custom mapping section if you must rename them).`,
}

export const PAGE = {
  icon: '📡',
  title: L(`SIMerald · SIM / eSIM 总控台（模板 ${TEMPLATE_VERSION}）`, `SIMerald · SIM / eSIM Console (Template ${TEMPLATE_VERSION})`),
  sourcePage: L('源数据库（请勿删除）', 'Source databases (do not delete)'),
  views: {
    renewals: L('📊 续费一览', '📊 Renewals'),
    dashboard: L('💰 消费分析', '💰 Spending'),
  },
}

// ===== Formula context helpers =====

export function findDatabase(key: DbKey): Database {
  return DATABASES.find(db => db.key === key)!
}

export function findColumn(db: DbKey, key: string): Column {
  const column = findDatabase(db).columns.find(c => c.key === key)
  if (!column)
    throw new Error(`Unknown column ${db}.${key}`)
  return column
}

export function findOption(db: DbKey, key: string, option: string): SelectOption {
  const found = findColumn(db, key).options?.find(o => o.key === option)
  if (!found)
    throw new Error(`Unknown option ${db}.${key}.${option}`)
  return found
}

function quote(text: string): string {
  return JSON.stringify(text)
}

export function formulaContext(lang: Lang, owner: DbKey): FormulaContext {
  const col = (db: DbKey, key: string) => findColumn(db, key).name[lang]
  return {
    lang,
    col,
    p: key => `prop(${quote(col(owner, key))})`,
    cp: (db, key) => `current.prop(${quote(col(db, key))})`,
    opt: (db, key, option) => quote(findOption(db, key, option).name[lang]),
    t: text => text[lang],
    q: text => quote(text[lang]),
  }
}

export function renderFormula(lang: Lang, owner: DbKey, column: Column): string {
  if (!column.formula)
    throw new Error(`${owner}.${column.key} is not a formula`)
  return column.formula(formulaContext(lang, owner))
}
