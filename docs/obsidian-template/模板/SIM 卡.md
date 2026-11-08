<%*
/*
 * 新建 SIM 卡（Templater 模板）。在「卡片/」里新建笔记时自动运行：依次弹出选择框，
 * 写好属性和第一行「首次购买/开卡」记录，并把笔记改名为「运营商 号码后4位」。
 * 选项来自「模板/下拉选项.md」；运营商还会从已有卡片和 logos/ 里的图片自动收集。
 * 任何一步按 Esc 都会跳过这一项，之后可以在属性里手动补。
 */
const OPTIONS_PATH = '模板/下拉选项.md'
const CARDS_FOLDER = '卡片'
const LOGOS_FOLDER = 'logos'
const IMAGE_EXTS = ['png', 'webp', 'jpg', 'jpeg', 'svg']
const NEW_ITEM = '__new__'
const DONE = '__done__'

// ---- 读取下拉选项笔记：二级标题是组名，「- 」开头的行是选项 ----
const optionsFile = app.vault.getAbstractFileByPath(OPTIONS_PATH)
const groups = {}
if (optionsFile) {
  let current = null
  for (const line of (await app.vault.read(optionsFile)).split('\n')) {
    const heading = line.match(/^##\s+(.+?)\s*$/)
    if (heading) {
      current = heading[1]
      groups[current] = []
      continue
    }
    const item = line.match(/^-\s+(.+?)\s*$/)
    if (current && item)
      groups[current].push(item[1].split('|').map(s => s.trim()))
  }
}
const group = name => groups[name] ?? []

// 和网站匹配 Logo 的规则一致：忽略大小写、空格和标点
const logoKey = name => name.normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '')

// ---- 带图片的选择框（Obsidian 自带的 SuggestModal）----
function pick(items, placeholder) {
  return new Promise((resolve) => {
    let chosen = null
    class Picker extends tp.obsidian.SuggestModal {
      getSuggestions(query) {
        const q = query.trim().toLowerCase()
        return items.filter(item => !q || item.label.toLowerCase().includes(q) || (item.hint ?? '').toLowerCase().includes(q))
      }

      renderSuggestion(item, el) {
        el.style.display = 'flex'
        el.style.alignItems = 'center'
        el.style.gap = '10px'
        if (item.image) {
          const img = el.createEl('img', { attr: { src: item.image } })
          img.style.width = '24px'
          img.style.height = '24px'
          img.style.objectFit = 'contain'
          img.style.borderRadius = '4px'
        }
        else {
          const icon = el.createSpan({ text: item.icon ?? '' })
          icon.style.width = '24px'
          icon.style.textAlign = 'center'
          icon.style.fontSize = '18px'
        }
        el.createSpan({ text: item.label })
        if (item.hint) {
          const hint = el.createSpan({ text: item.hint })
          hint.style.marginLeft = 'auto'
          hint.style.opacity = '0.6'
          hint.style.fontSize = '0.85em'
        }
      }

      onChooseSuggestion(item) {
        chosen = item
      }

      onClose() {
        // Obsidian 先关窗口再回调选中项，所以稍等一下再交出结果
        setTimeout(() => resolve(chosen), 0)
      }
    }
    const modal = new Picker(app)
    modal.setPlaceholder(placeholder)
    modal.open()
  })
}

async function ask(prompt, defaultValue = '') {
  const value = await tp.system.prompt(prompt, defaultValue, false)
  return (value ?? '').trim()
}

// ---- 运营商：下拉选项 + 已有卡片 + logos 图片 ----
const logoFiles = app.vault.getFiles().filter(f => f.path.startsWith(`${LOGOS_FOLDER}/`) && IMAGE_EXTS.includes(f.extension))
const logoOf = name => logoFiles.find(f => logoKey(f.basename) === logoKey(name))
const carriers = new Map()
const addCarrier = (name) => {
  const clean = (name ?? '').toString().trim()
  if (clean && !carriers.has(logoKey(clean)))
    carriers.set(logoKey(clean), clean)
}
for (const [name] of group('运营商'))
  addCarrier(name)
for (const file of app.vault.getMarkdownFiles().filter(f => f.path.startsWith(`${CARDS_FOLDER}/`)))
  addCarrier(app.metadataCache.getFileCache(file)?.frontmatter?.['运营商'])
for (const file of logoFiles)
  addCarrier(file.basename)

const carrierItems = [...carriers.values()]
  .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))
  .map((name) => {
    const logo = logoOf(name)
    return { value: name, label: name, image: logo ? app.vault.getResourcePath(logo) : null, icon: '📶' }
  })
carrierItems.push({ value: NEW_ITEM, label: '新运营商…', icon: '➕' })

let carrier = (await pick(carrierItems, '选运营商 / eSIM 供应商（可以打字搜索）'))?.value ?? ''
if (carrier === NEW_ITEM)
  carrier = await ask('运营商名称（想显示 Logo，就往 logos/ 放一张同名图片）')

// ---- 国家：选了之后带出默认币种和区号 ----
const countryItems = group('国家').map(([name, currency, code]) => ({
  value: name,
  label: name.replace(/^\S+\s*/, ''),
  icon: name.split(/\s+/)[0],
  hint: [code, currency].filter(Boolean).join(' · '),
  currency,
  code,
}))
countryItems.push({ value: NEW_ITEM, label: '其他国家…', icon: '🌐' })
const countryPick = await pick(countryItems, '选号码所属国家')
let country = countryPick?.value ?? ''
if (country === NEW_ITEM)
  country = await ask('国家，格式「国旗 名称」，例如 🇮🇪 爱尔兰')

// ---- 类型 ----
const typePick = await pick(group('类型').map(([name]) => ({ value: name, label: name, icon: name.includes('虚拟') ? '☁️' : name.includes('卡托') ? '💾' : name.includes('eSIM') ? '📱' : '🪪' })), '选卡片类型')
const type = typePick?.value ?? ''

// ---- 保号方式：可多选，选完点「完成」----
const keepAlive = []
while (true) {
  const items = group('保号方式')
    .filter(([name]) => !keepAlive.includes(name))
    .map(([name]) => ({ value: name, label: name, icon: '⬜️' }))
  items.unshift({ value: DONE, label: keepAlive.length ? `完成（已选：${keepAlive.join('、')}）` : '完成（不选）', icon: '✅' })
  const choice = await pick(items, '选保号方式，可以多选')
  if (!choice || choice.value === DONE)
    break
  keepAlive.push(choice.value)
}

// ---- 续费周期 ----
const cycleItems = group('续费周期').map(([name]) => ({ value: name, label: name, icon: '🔁' }))
cycleItems.push({ value: NEW_ITEM, label: '自定义…', icon: '✏️' })
let cycle = (await pick(cycleItems, '选续费周期'))?.value ?? ''
if (cycle === NEW_ITEM)
  cycle = await ask('续费周期，例如 60 天、2 年')

// ---- 币种：国家的默认币种排第一 ----
const currencies = [...new Set([countryPick?.currency, ...group('币种').map(([code]) => code)].filter(Boolean))]
const currencyItems = currencies.map(code => ({ value: code, label: code, icon: '💱', hint: code === countryPick?.currency ? '国家默认' : '' }))
currencyItems.push({ value: NEW_ITEM, label: '其他币种…', icon: '✏️' })
let currency = (await pick(currencyItems, '选续费币种'))?.value ?? countryPick?.currency ?? ''
if (currency === NEW_ITEM)
  currency = (await ask('币种三位代码，例如 NZD')).toUpperCase()

// ---- 数字和号码 ----
const price = await ask(`每次续费多少（${currency || '金额'}，没有可留空）`)
const number = await ask('号码（带国家区号）', countryPick?.code ? `${countryPick.code} ` : '+')
const purchase = await ask(`开卡花了多少（${currency || '金额'}，没有可留空）`)
const rate = purchase && currency && currency !== 'CNY' ? await ask(`开卡时汇率（1 ${currency} = ? 人民币，用来算累计花费，不知道可留空）`) : ''

// ---- 第一行记录：今天开卡，有效期按续费周期推算 ----
const today = tp.date.now('YYYY-MM-DD')
const cycleMatch = cycle.match(/(\d+(?:\.\d+)?)/)
let cycleDays = cycleMatch ? Number(cycleMatch[1]) : 0
if (/年/.test(cycle))
  cycleDays *= 365
else if (/月/.test(cycle))
  cycleDays *= 30
const extendsTo = cycleDays ? tp.date.now('YYYY-MM-DD', Math.round(cycleDays)) : ''

// ---- 写入笔记 ----
const q = value => JSON.stringify(value ?? '')
const list = values => `[${values.map(v => JSON.stringify(v)).join(', ')}]`
const digits = number.replace(/\D/g, '')
const last4 = digits.length >= 4 ? digits.slice(-4) : ''

tR += `---
运营商: ${q(carrier)}
号码: ${q(digits ? number : '')}
国家: ${q(country)}
类型: ${q(type)}
保号方式: ${list(keepAlive)}
续费周期: ${q(cycle)}
续费金额: ${price || ''}
币种: ${q(currency)}
设备:
余额:
余额更新日期:
下次续费（手动）:
停用日期:
绑定服务: []
管理账号:
扣款账户: []
---

| 日期 | 类型 | 金额 | 币种 | 汇率 | 有效期延至 | 备注 |
| ---- | ---- | ---- | ---- | ---- | ---------- | ---- |
| ${today} | 首次购买/开卡 | ${purchase} | ${currency} | ${rate} | ${extendsTo} |  |
`

// 笔记改名为「运营商 号码后4位」，重名时加序号
const baseName = [carrier, last4].filter(Boolean).join(' ').replace(/[\\/:*?"<>|#^[\]]/g, ' ').trim()
if (baseName) {
  let name = baseName
  for (let i = 2; app.vault.getAbstractFileByPath(`${tp.file.folder(true)}/${name}.md`) && name !== tp.file.title; i++)
    name = `${baseName} ${i}`
  if (name !== tp.file.title)
    await tp.file.rename(name)
}
%>
