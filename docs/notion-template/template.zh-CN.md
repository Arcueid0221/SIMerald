# SIMerald Notion 模板 v1（中文）

> 本文件由 `scripts/notion-template/build.ts` 根据 `scripts/notion-template/template.ts` 生成，请勿手动修改。

这是 SIMerald 官方 Notion 中文模板的完整定义：三个数据库的每一列、选项、公式原文和示例数据。可以照着它核对自己复制的模板，或者手动建库。

English version: [template.md](template.md)

## 模板页面

模板页面「📡 SIMerald · SIM / eSIM 总控台（模板 v1）」顶部是使用指南，下面是「📊 续费一览」（按下次续费日期排序的卡片表）和「💰 消费分析」（待修数据计数、消费占比图表），三个数据库放在子页面「源数据库（请勿删除）」里。

> ### 使用说明
> - **这是什么**：SIMerald 官方 Notion 模板 v1，可单独用作 SIM/eSIM 续费管理工具，也可配合 SIMerald 生成公开卡片墙（[配置教程](https://github.com/BurningSky0306/simerald/blob/main/docs/notion-setup.zh-CN.md)）。
> - **首次使用**：带 🧪 图标的条目均为虚构示例，参考写法后请将示例卡片、记录和支付账户全部删除。
> - **日常查看**：平时看「📊 续费一览」；当「⚠️ 数据检查」列出现提示时，按文字修正。
> - **新增卡片**：在「SIM 卡」库新建一行，填好身份信息（名称格式“运营商 · 后 4 位”、+国家码格式号码、国家、卡片类型、设备）、保号动作、续费周期/金额/币种与「默认扣款账户」；再在该卡的「消费记录」库新增一条「首次购买/开卡」记录（日期为拿卡日），填好「本次有效期延至」与「扣款账户」。备注、教程、实名信息写在卡片正文。
> - **续费/保号**：只需在「消费记录」库新增一条「续费/保号」记录并填好「本次有效期延至」和「扣款账户」，卡片的「当前有效期至」、「下次续费日期」与「号码状态」会自动更新，无需改卡。
> - **其他支出**：同样新增「消费记录」，类型选「额外充值」或「其他费用」，「本次有效期延至」留空。消耗话费余额不算新消费，往余额充值才算，需填实际出钱的「扣款账户」。
> - **特殊续费日**：若最佳续费时机不是到期日当天（如续费窗口、优惠截止），填写「下次续费日期（手动覆盖）」（可填单日或日期范围），续费后清空。
> - **停用号码**：先迁走绑定的服务，再填「停用日期」（「号码状态」会自动变为已注销），停用原因写在卡片正文，不要删卡。
> - **国家与币种**：新增国家须保持“国旗 emoji + 空格 + 名称”格式；「⚠️ 数据检查」仅校验模板内置国家/币种的区号与汇率范围，其余会自动跳过。
> - **请勿改列名**：SIMerald 与公式按列名读取数据（若必须改名，请参考教程的自定义映射章节）。

## 📱 SIM 卡

每张 SIM / eSIM 卡占一行

| 列名 | 类型 | 选项 / 计算方式 | 说明 | SIMerald 字段 |
| --- | --- | --- | --- | --- |
| 卡片名称 | Title |  | 写法：运营商简称 · 号码后 4 位，如 Harbour Mobile · 0123（数据检查会校验后 4 位）。 | `cards.name` |
| 号码 | Phone |  | 请按 E.164 国际格式填写完整号码，如 +85255550123。 | `cards.number` |
| 号码国家 | Select | 🇨🇳 中国, 🇭🇰 中国香港, 🇲🇴 中国澳门, 🇹🇼 中国台湾, 🇯🇵 日本, 🇰🇷 韩国, 🇸🇬 新加坡, 🇲🇾 马来西亚, 🇹🇭 泰国, 🇵🇭 菲律宾, 🇮🇩 印度尼西亚, 🇻🇳 越南, 🇱🇰 斯里兰卡, 🇦🇪 阿联酋, 🇹🇷 土耳其, 🇬🇧 英国, 🇩🇪 德国, 🇫🇷 法国, 🇳🇱 荷兰, 🇪🇸 西班牙, 🇮🇹 意大利, 🇵🇱 波兰, 🇪🇪 爱沙尼亚, 🇨🇭 瑞士, 🇺🇸 美国, 🇨🇦 加拿大, 🇲🇽 墨西哥, 🇧🇷 巴西, 🇦🇺 澳大利亚, 🇳🇿 新西兰 | 格式为“国旗 emoji + 空格 + 名称”，新增国家也请照此填写，SIMerald 靠国旗定位卡片。 | `cards.country` |
| 卡片类型 | Select | 实体 SIM, eSIM · 直写手机, eSIM · 卡托, 虚拟号码（仅 App） | SIMerald 会按选项名称中的关键词自动判断大类：实体 / eSIM / 卡托 / 虚拟。 | `cards.type` |
| 主要使用设备 | Select | 主力机, 备用机, 卡托, 未装机 | 这张卡日常装在哪台设备里使用（仅站长可见）。 | `cards.device` |
| 保号动作 | Multi-select | 充值余额, 购买/启用增值服务, 有效使用（含收发短信）, 产生余额变动（如发漫游短信）, 自动扣费, 购买续费套餐 | 让号码保持有效需要执行的操作，可多选。 | `cards.keepAlive` |
| 续费周期 | Select | 每 30 天, 每 90 天, 每 180 天, 每 365 天, 不固定（取决于充值/服务组合） | 两次续费之间的大致间隔天数，SIMerald 会提取选项名称里的第一个数字。 | `cards.cycle` |
| 续费金额 | Number |  | 每次续费或保号的费用，币种见「续费币种」；免费保号请填 0。 | `cards.price` |
| 续费币种 | Select | CNY ¥, HKD HK$, MOP MOP$, TWD NT$, JPY ¥, KRW ₩, SGD S$, MYR RM, THB ฿, PHP ₱, IDR Rp, VND ₫, LKR Rs, AED Dh, TRY ₺, GBP £, EUR €, PLN zł, CHF Fr, USD $, CAD C$, MXN Mex$, BRL R$, AUD A$, NZD NZ$ | 计算「续费金额」与「当前余额」所用的货币。 | `cards.currency` |
| 当前余额 | Number |  | 卡片当前的账户余额，币种同「续费币种」（仅站长可见）。 | `cards.balance` |
| 余额更新日期 | Date |  | 最近一次核对余额的日期；靠余额保号的卡若超过 90 天未更新会被数据检查提示。 | `cards.balanceUpdatedAt` |
| 消费记录 | Relation | 关联「消费记录」，双向，对方列名「SIM 卡」 | 关联这张卡的历次消费（含首购与续费），在「消费记录」库新建后会自动显示在此。 |  |
| 当前有效期至 | Formula | 见下方公式原文 | 自动：取按消费日期排序最近一条记录的「本次有效期延至」（同日多条取最晚），请勿手填。 | `cards.expiresAt` |
| 号码状态 | Formula | 见下方公式原文 | 自动：填了「停用日期」为已注销，过了「当前有效期至」为已过期，其余为使用中。 | `cards.status` |
| 下次续费日期（手动覆盖） | Date |  | 仅当最佳续费日不是到期日当天时填写（如续费窗口、优惠截止，支持日期范围），续费后请清空或更新。 | `cards.nextRenewalOverride` |
| 下次续费日期 | Formula | 见下方公式原文 | 自动：优先采用「下次续费日期（手动覆盖）」，未填则等于「当前有效期至」，已注销后为空。 | `cards.nextRenewal` |
| 停用日期 | Date |  | 号码正式注销或放弃的日期，填写后状态会自动变为已注销。 | `cards.cancelledAt` |
| 首次购买日期 | Rollup | 汇总「消费记录」的「消费日期」，取最早日期 | 自动：汇总关联消费记录中最早一笔的日期。 | `cards.firstPurchaseAt` |
| 卡消费合计 CNY | Rollup | 汇总「消费记录」的「等额 CNY」，求和 | 自动：这张卡所有关联消费记录的等额人民币总和。 | `cards.totalSpentCNY` |
| 续费紧急度 | Formula | 见下方公式原文 | 自动：按续费紧迫程度分档（⑨ 已注销；⑧ 无日期；① 已逾期；⓪ 在续费窗口内；②~⑦ 按剩余天数）。 | `cards.urgency` |
| 绑定的服务 | Multi-select | Telegram, WhatsApp, Signal, Apple ID, Google, 银行/支付, 其他 | 绑定或注册过该号码的网站与服务，停用号码前请先完成换绑（仅站长可见）。 | `cards.services` |
| 管理账号 | Text |  | 登录运营商官方 App 或网站所用的账号（仅站长可见）。 | `cards.account` |
| 默认扣款账户 | Relation | 关联「支付账户」，双向，对方列名「SIM 卡」 | 这张卡日常续费默认使用的付款账户（仅站长可见）。 | `cards.paymentAccounts` |
| ⚠️ 数据检查 | Formula | 见下方公式原文 | 自动：检测到漏填或数据不一致时显示修正提示，为空代表一切正常。 | `cards.dataCheck` |

## 💰 消费记录

首购、续费、充值等每笔消费占一行

| 列名 | 类型 | 选项 / 计算方式 | 说明 | SIMerald 字段 |
| --- | --- | --- | --- | --- |
| 记录 | Title |  | 写法：卡片名称 · 类型 · 日期，如 Harbour Mobile · 0123 · 首购 · 2026-10-01（仅站长可见）。 | `records.title` |
| SIM 卡 | Relation | 关联「SIM 卡」，双向，对方列名「消费记录」，限 1 条 | 这笔消费记录所对应的号码卡片。 | `records.card` |
| 消费类型 | Select | 首次购买/开卡, 续费/保号, 额外充值, 其他费用 | 首次购买/开卡与续费/保号会更新卡片有效期，额外充值与其他费用仅作记账。 | `records.type` |
| 消费日期 | Date |  | 实际付款购买或完成保号操作的日期。 | `records.date` |
| 支付金额 | Number |  | 按实际扣款币种填写的原始金额，免费保号请填 0。 | `records.amount` |
| 货币 | Select | CNY ¥, HKD HK$, MOP MOP$, TWD NT$, JPY ¥, KRW ₩, SGD S$, MYR RM, THB ฿, PHP ₱, IDR Rp, VND ₫, LKR Rs, AED Dh, TRY ₺, GBP £, EUR €, PLN zł, CHF Fr, USD $, CAD C$, MXN Mex$, BRL R$, AUD A$, NZD NZ$ | 填写「支付金额」所使用的币种。 | `records.currency` |
| 当时汇率 | Number | 显示 4 位小数 | 1 单位该外币折合多少人民币；币种本身为人民币时请留空。 | `records.rate` |
| 等额 CNY | Formula | 见下方公式原文 | 自动：由「支付金额」乘以「当时汇率」算出，外币未填汇率时为空。 | `records.amountCNY` |
| 本次有效期延至 | Date |  | 本次操作后号码的新到期日；首次购买/开卡和续费/保号必填，额外充值和其他费用留空。 | `records.extendsTo` |
| 扣款账户 | Relation | 关联「支付账户」，双向，对方列名「消费记录」 | 这笔消费实际出钱付款的账户（仅站长可见）。 | `records.accounts` |
| ⚠️ 数据检查 | Formula | 见下方公式原文 | 自动：检测到漏填或数据不一致时显示修正提示，为空代表一切正常。 |  |

## 💳 支付账户

付续费用的银行卡、钱包等；只有站长登录后才能看到账户名称

| 列名 | 类型 | 选项 / 计算方式 | 说明 | SIMerald 字段 |
| --- | --- | --- | --- | --- |
| 账户名称 | Title |  | 建议写法：平台名称 · 尾号，如 示例银行 · 4242。 | `accounts` (title) |
| 账户类型 | Select | 银行卡, 虚拟卡, 支付宝, 微信支付, PayPal, 平台余额, 其他 | 该支付账户所属的资金渠道类型。 |  |
| 状态 | Select | 正常, 余额不足, 已冻结, 已注销 | 账户当前能否正常扣款；遇到余额不足、冻结或销户时请及时更新。 |  |
| SIM 卡 | Relation | 关联「SIM 卡」，双向，对方列名「默认扣款账户」 | 将此账户设为「默认扣款账户」的所有卡片。 |  |
| 消费记录 | Relation | 关联「消费记录」，双向，对方列名「扣款账户」 | 历次使用此账户实际付款的消费记录。 |  |

## 公式原文

复制代码块里的全部内容，粘贴到 Notion 公式编辑器即可。

### SIM 卡 · 当前有效期至

```text
lets(
  /* 只看同时填了「本次有效期延至」和「消费日期」的记录 */
  valid, prop("消费记录").filter(!empty(current.prop("本次有效期延至")) and !empty(current.prop("消费日期"))),
  /* 最近一次操作的日期 */
  latestDay, valid.map(timestamp(dateStart(current.prop("消费日期")))).sort().last(),
  sameDay, valid.filter(timestamp(dateStart(current.prop("消费日期"))) == latestDay),
  /* 同一天有多条时取最晚的延至日期 */
  latestExtends, sameDay.map(timestamp(dateStart(current.prop("本次有效期延至")))).sort().last(),
  if(empty(valid), parseDate(""),
    sameDay.find(timestamp(dateStart(current.prop("本次有效期延至"))) == latestExtends).prop("本次有效期延至"))
)
```

### SIM 卡 · 号码状态

```text
lets(
  expires, prop("当前有效期至"),
  /* 填了停用日期 = 已注销；过了有效期 = 已过期；其余 = 使用中。and/or 不短路，所以日期判断用嵌套 if */
  if(!empty(prop("停用日期")), "已注销",
    if(empty(expires), "使用中",
      if(dateBetween(today(), expires, "days") >= 1, "已过期", "使用中")))
)
```

### SIM 卡 · 下次续费日期

```text
lets(
  expires, prop("当前有效期至"),
  /* 只有已注销才留空；已过期仍显示本该续费的日期，方便补救 */
  if(prop("号码状态") == "已注销" or empty(expires), parseDate(""),
    /* 填了手动覆盖就以它为准，否则就是当前有效期至 */
    if(!empty(prop("下次续费日期（手动覆盖）")), prop("下次续费日期（手动覆盖）"), expires))
)
```

### SIM 卡 · 续费紧急度

```text
lets(
  status, prop("号码状态"),
  override, prop("下次续费日期（手动覆盖）"),
  /* 目标续费日期：填了手动覆盖用它，否则用当前有效期至 */
  target, if(!empty(override), override, prop("当前有效期至")),
  startDay, dateStart(target),
  endDay, dateEnd(target),
  /* 按顺序互斥划分，命中即停 */
  ifs(
    status == "已注销", "⑨ 号码已失效",
    empty(target), "⑧ 无续费日期",
    status == "已过期" or dateBetween(today(), endDay, "days") >= 1, "① 已逾期",
    dateBetween(endDay, startDay, "days") > 0 and dateBetween(today(), startDay, "days") >= 0,
      "⓪ 续费窗口开放中（剩 " + format(dateBetween(endDay, today(), "days")) + " 天）",
    dateBetween(startDay, today(), "days") <= 3, "② 未来 3 天内",
    dateBetween(startDay, today(), "days") <= 7, "③ 未来 7 天内",
    dateBetween(startDay, today(), "days") <= 15, "④ 未来 15 天内",
    dateBetween(startDay, today(), "days") <= 30, "⑤ 未来 30 天内",
    dateBetween(startDay, today(), "days") <= 60, "⑥ 未来 60 天内",
    "⑦ 超过 60 天"
  )
)
```

### SIM 卡 · ⚠️ 数据检查

```text
lets(
  status, prop("号码状态"),
  inactive, status == "已过期" or status == "已注销",
  expires, prop("当前有效期至"),
  override, prop("下次续费日期（手动覆盖）"),
  balanceDay, prop("余额更新日期"),
  actions, prop("保号动作"),
  /* 靠余额保号：选了「有效使用」或「产生余额变动」。改了这两个选项名时要同步改这里 */
  needsBalance, actions.includes("有效使用（含收发短信）") or actions.includes("产生余额变动（如发漫游短信）"),
  number, replaceAll(format(prop("号码")), " ", ""),
  country, format(prop("号码国家")),
  kind, format(prop("卡片类型")),
  /* 消费记录的日期一律转成时间戳再比较；先滤掉没填日期的记录 */
  dated, prop("消费记录").filter(!empty(current.prop("消费日期"))),
  purchases, prop("消费记录").filter(format(current.prop("消费类型")) == "首次购买/开卡").length(),
  purchaseDay, dated.filter(format(current.prop("消费类型")) == "首次购买/开卡").map(timestamp(dateStart(current.prop("消费日期")))).sort().first(),
  earliestDay, dated.map(timestamp(dateStart(current.prop("消费日期")))).sort().first(),
  lastRenewalDay, dated.filter(!empty(current.prop("本次有效期延至"))).map(timestamp(dateStart(current.prop("消费日期")))).sort().last(),
  missing, [
    if(empty(prop("号码国家")), "号码国家", ""),
    if(empty(prop("卡片类型")), "卡片类型", ""),
    /* 虚拟号码只在 App 里收短信，不需要设备 */
    if(kind != "虚拟号码（仅 App）" and empty(prop("主要使用设备")), "主要使用设备", ""),
    if(empty(actions), "保号动作", ""),
    if(empty(prop("续费周期")), "续费周期", "")
  ].filter(current != "").join("、"),
  /* 号码国家对应的区号；不在列表里的国家直接跳过，不做检查 */
  callingCode, ifs(test(country, "中国$"), "+86", test(country, "中国香港$"), "+852", test(country, "中国澳门$"), "+853", test(country, "中国台湾$"), "+886", test(country, "日本$"), "+81", test(country, "韩国$"), "+82", test(country, "新加坡$"), "+65", test(country, "马来西亚$"), "+60", test(country, "泰国$"), "+66", test(country, "菲律宾$"), "+63", test(country, "印度尼西亚$"), "+62", test(country, "越南$"), "+84", test(country, "斯里兰卡$"), "+94", test(country, "阿联酋$"), "+971", test(country, "土耳其$"), "+90", test(country, "英国$"), "+44", test(country, "德国$"), "+49", test(country, "法国$"), "+33", test(country, "荷兰$"), "+31", test(country, "西班牙$"), "+34", test(country, "意大利$"), "+39", test(country, "波兰$"), "+48", test(country, "爱沙尼亚$"), "+372", test(country, "瑞士$"), "+41", test(country, "美国$"), "+1", test(country, "加拿大$"), "+1", test(country, "墨西哥$"), "+52", test(country, "巴西$"), "+55", test(country, "澳大利亚$"), "+61", test(country, "新西兰$"), "+64", ""),
  /* 注意：Notion 的 and/or 不短路，日期为空时不能直接做日期运算，所以日期判断都用嵌套 if */
  [
    if(empty(number), "缺号码",
      if(!test(number, "^[+][0-9]+$"), "号码应为 +国家码 格式（只含数字）",
        if(!prop("卡片名称").contains(number.substring(number.length() - 4)), "标题未带号码后 4 位", ""))),
    if(empty(number) or callingCode == "", "",
      if(number.substring(0, callingCode.length()) != callingCode, "号码与号码国家不符（应以 " + callingCode + " 开头）", "")),
    if(!inactive and missing != "", "缺必填项：" + missing, ""),
    if(status == "已过期", "已过期：续了就补一条续费记录，没续就填停用日期", ""),
    /* 号码失效后可能被回收，绑定的账号有被接管的风险 */
    if(inactive and !empty(prop("绑定的服务")), "号码已失效但仍绑定：" + format(prop("绑定的服务")), ""),
    if(!inactive and empty(expires), "没有任何消费记录填写「本次有效期延至」（首购也要填）", ""),
    if(purchases != 1, "首购记录应为 1 条（当前 " + format(purchases) + " 条）", ""),
    if(empty(purchaseDay) or empty(earliestDay), "",
      if(earliestDay < purchaseDay, "有消费记录早于首购记录，请核对日期或消费类型", "")),
    if(empty(override) or empty(expires), "",
      if(dateBetween(dateEnd(override), expires, "days") > 0, "手动覆盖的续费日期晚于当前有效期至", "")),
    if(empty(override) or empty(lastRenewalDay), "",
      if(timestamp(dateStart(override)) < lastRenewalDay, "手动覆盖的续费日期早于最近一次续费，已过时，请清空或更新", "")),
    if(!inactive and prop("续费金额") > 0 and empty(prop("默认扣款账户")), "续费要花钱但缺默认扣款账户", ""),
    if((format(prop("续费金额")) == "") != empty(prop("续费币种")), "续费金额和续费币种只填了一个", ""),
    /* 余额：0 元是有效值，所以用 format() 判断是否没填 */
    if(inactive or !needsBalance, "", if(format(prop("当前余额")) == "", "靠余额保号但缺当前余额",
      if(prop("当前余额") <= 0, "余额为 0，无法靠余额保号", ""))),
    if(inactive or !needsBalance, "",
      if(empty(balanceDay), "靠余额保号但缺余额更新日期",
        if(dateBetween(today(), dateStart(balanceDay), "days") > 90, "余额超 90 天未更新，请核对", "")))
  ].filter(current != "").join("；")
)
```

### 消费记录 · 等额 CNY

```text
if(
  empty(prop("支付金额")),
  0,
  /* 人民币直接取原值；外币必须填汇率，漏填时返回空值 */
  if(
    prop("货币") == "CNY ¥",
    prop("支付金额"),
    if(empty(prop("当时汇率")), toNumber(""), round(prop("支付金额") * prop("当时汇率") * 100) / 100)
  )
)
```

### 消费记录 · ⚠️ 数据检查

```text
lets(
  amountText, format(prop("支付金额")),
  day, prop("消费日期"),
  currency, format(prop("货币")),
  kind, format(prop("消费类型")),
  rate, prop("当时汇率"),
  extendsTo, prop("本次有效期延至"),
  hasCard, !empty(prop("SIM 卡")),
  /* 关联卡的字段用 map 读，没关联卡时得到空值而不是出错 */
  cardDigits, replaceAll(prop("SIM 卡").map(format(current.prop("号码"))).join(""), "[^0-9]", ""),
  cycleDays, toNumber(replaceAll(prop("SIM 卡").map(format(current.prop("续费周期"))).join(""), "[^0-9]", "")),
  /* 各货币「1 外币 = ? 人民币」的合理范围；不在列表里的货币直接跳过 */
  range, ifs(currency == "HKD HK$", [0.7, 1.1], currency == "MOP MOP$", [0.65, 1.1], currency == "TWD NT$", [0.15, 0.3], currency == "JPY ¥", [0.03, 0.07], currency == "KRW ₩", [0.003, 0.008], currency == "SGD S$", [4.5, 6.5], currency == "MYR RM", [1.2, 2.1], currency == "THB ฿", [0.15, 0.3], currency == "PHP ₱", [0.08, 0.16], currency == "IDR Rp", [0.0003, 0.0006], currency == "VND ₫", [0.0002, 0.0004], currency == "LKR Rs", [0.015, 0.035], currency == "AED Dh", [1.5, 2.5], currency == "TRY ₺", [0.08, 0.35], currency == "GBP £", [7.5, 11.5], currency == "EUR €", [6.5, 9.5], currency == "PLN zł", [1.4, 2.5], currency == "CHF Fr", [7, 10.5], currency == "USD $", [6, 8], currency == "CAD C$", [4, 6.2], currency == "MXN Mex$", [0.28, 0.5], currency == "BRL R$", [0.9, 1.8], currency == "AUD A$", [3.6, 5.6], currency == "NZD NZ$", [3.3, 5.3], []),
  /* 注意：empty(0) 为真，所以用 format() 区分「没填」和「填了 0」 */
  [
    if(!hasCard, "未关联 SIM 卡", ""),
    if(empty(day), "缺消费日期",
      if(dateBetween(dateStart(day), today(), "days") > 0, "消费日期在未来", "")),
    if(kind == "", "缺消费类型", ""),
    if(currency == "", "缺货币", ""),
    if(amountText == "", "缺支付金额（0 元请填 0）", ""),
    if(currency != "" and currency != "CNY ¥" and prop("支付金额") > 0 and empty(rate), "外币缺汇率", ""),
    /* 汇率填反（如把 0.043 填成 23）会让金额差几十倍 */
    if(currency == "" or currency == "CNY ¥" or empty(rate) or empty(range), "",
      if(rate < range.at(0) or rate > range.at(1), "汇率 " + format(rate) + " 超出 " + currency + " 的合理范围（" + format(range.at(0)) + "–" + format(range.at(1)) + "），是否填反了？", "")),
    /* 标题里的号码后 4 位要和关联卡一致 */
    if(cardDigits.length() < 4, "",
      if(!prop("记录").contains(cardDigits.substring(cardDigits.length() - 4)), "标题与关联卡的号码后 4 位不一致，是否选错了卡？", "")),
    /* 首购和续费/保号必填「本次有效期延至」；额外充值和其他费用不该填；且必须晚于消费日期 */
    if((kind == "首次购买/开卡" or kind == "续费/保号") and empty(extendsTo), "「" + kind + "」记录缺「本次有效期延至」", ""),
    if(!empty(extendsTo) and (kind == "额外充值" or kind == "其他费用"), "「" + kind + "」不影响有效期，不应填「本次有效期延至」", ""),
    if(empty(extendsTo) or empty(day), "",
      if(dateBetween(dateStart(extendsTo), dateStart(day), "days") <= 0, "「本次有效期延至」应晚于消费日期", "")),
    /* 有效期跨度：续费/保号不超过「续费周期 + 30 天」（周期不固定按 400 天）；首购只拦超过 1830 天（约 5 年）的年份笔误 */
    if(empty(extendsTo) or empty(day) or !hasCard, "",
      lets(
        limit, if(kind == "首次购买/开卡", 1830, if(empty(cycleDays), 400, cycleDays + 30)),
        if(dateBetween(dateStart(extendsTo), dateStart(day), "days") > limit, "有效期跨度超过 " + format(limit) + " 天，请核对年份", ""))),
    if(prop("支付金额") > 0 and empty(prop("扣款账户")), "付了钱但缺扣款账户", "")
  ].filter(current != "").join("；")
)
```

## 示例数据

模板里带 🧪 图标的行是示例，熟悉后删掉即可。号码和运营商都是虚构的。

### SIM 卡

| 卡片名称 | 号码 | 号码国家 | 卡片类型 | 续费周期 | 续费金额 | 续费币种 | 停用日期 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 🧪 Harbour Mobile · 0123 | +85255550123 | 🇭🇰 中国香港 | 实体 SIM | 每 365 天 | 18 | HKD HK$ |  |
| 🧪 Fjord Telecom · 5012 | +3725555012 | 🇪🇪 爱沙尼亚 | eSIM · 卡托 | 每 365 天 | 0 | EUR € |  |
| 🧪 Kiwi Wireless · 0166 | +64215550166 | 🇳🇿 新西兰 | 实体 SIM | 每 365 天 | 10 | NZD NZ$ | 2026-07-20 |

### 消费记录

| 记录 | 消费类型 | 消费日期 | 支付金额 | 货币 | 当时汇率 | 本次有效期延至 |
| --- | --- | --- | --- | --- | --- | --- |
| 🧪 Harbour Mobile · 0123 · 首购 · 2026-10-01 | 首次购买/开卡 | 2026-10-01 | 128 | HKD HK$ | 0.92 | 2029-09-30 |
| 🧪 Fjord Telecom · 5012 · 首购 · 2025-12-01 | 首次购买/开卡 | 2025-12-01 | 4.5 | EUR € | 7.9 | 2026-12-01 |
| 🧪 Fjord Telecom · 5012 · 续费 · 2026-10-15 | 续费/保号 | 2026-10-15 | 0 | EUR € |  | 2027-10-15 |
| 🧪 Kiwi Wireless · 0166 · 首购 · 2024-08-01 | 首次购买/开卡 | 2024-08-01 | 20 | NZD NZ$ | 4.3 | 2025-08-01 |
| 🧪 Kiwi Wireless · 0166 · 续费 · 2025-07-25 | 续费/保号 | 2025-07-25 | 10 | NZD NZ$ | 4.3 | 2026-08-01 |

### 支付账户

- 🧪 示例银行 · 4242（银行卡）
- 🧪 示例 PayPal（PayPal）
