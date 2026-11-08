<div align="center">

# SIMerald（Obsidian + Cloudflare 版）

**把 Obsidian 里记的 SIM / eSIM 卡，做成一面公开的卡片墙，跑在 Cloudflare Workers 上。**

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/screenshot-dark.webp">
  <img src="docs/screenshot-light.webp" alt="SIMerald 首页（演示数据）" width="100%">
</picture>

</div>

这是 [BurningSky0306/simerald](https://github.com/BurningSky0306/simerald)（MIT）的改造版，界面来自 [Komari Emerald](https://github.com/Tokinx/komari-theme-emerald)。和原版的区别：

- 数据不再来自 Notion，而是 Obsidian 的 ESIM 库：每张卡一篇笔记，由 Remotely Save 同步到 R2，在后台点「同步笔记」读进来。
- 后端从 Node + Docker 改成 Cloudflare Worker（静态页面 + R2 + KV），不占服务器。
- 后台登录交给 Cloudflare Access（邮箱验证码），删掉了原版自写的密码、两步验证和恢复码。
- 没有定时同步，只有手动按钮。

## 效果

- 首页：地球按国家落点，统计卡（在用号码、覆盖国家、30 天内续费、累计花费等），三种卡片样式，中英双语，深色模式。
- 访客只看到号码后 4 位。完整号码、余额、设备、绑定服务、管理账号、扣款账户、记录备注、笔记文件名都在 Worker 里按白名单过滤掉（`worker/view.ts`）。
- 用 Access 登录过的站长，在首页和详情页能看到这些私密字段。
- 「已过期」「下次续费」每次请求都按北京时间的当天重新算，不用每天同步。

## 数据怎么流动

```
Obsidian（iCloud 里的 ESIM 库）
   └─ Remotely Save ──> R2 存储桶 esim-notes
                           └─ 后台「同步笔记」──> Worker 读笔记、算有效期 ──> KV（快照）
                                                                      └─ 访客打开页面时读 KV
```

## 笔记格式

每张卡一篇笔记，放在库里的 `卡片/` 文件夹（文件夹名由 `wrangler.jsonc` 的 `CARDS_FOLDER` 决定）。

### 用下拉框填（Templater）

`docs/obsidian-template/` 是放进 ESIM 库的文件，需要库里装 Templater 插件：

| 文件                   | 作用                                                                                                                                                                                                                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `模板/SIM 卡.md`       | 在 `卡片/` 里新建笔记时自动运行：依次弹出运营商（带 `logos/` 里的 Logo）、国家（带国旗，选了自动带出币种和区号）、类型、保号方式（多选）、续费周期、币种的选择框，再问金额和号码；写好属性和第一行「首次购买/开卡」记录（有效期按周期推算），并把笔记改名为「运营商 后4位」。按 Esc 跳过某一项 |
| `模板/续费记录.md`     | 在某张卡的笔记里运行「Templater: 插入模板」选它：选记录类型和币种，问日期、金额、汇率，「有效期延至」默认是当前有效期加一个周期；把一行加到表格末尾                                                                                                                                            |
| `模板/下拉选项.md`     | 上面两个模板的选项列表（国家、类型、保号方式、周期、币种、记录类型、运营商），直接改这篇笔记就能增减                                                                                                                                                                                           |
| `.obsidian/types.json` | 属性类型：日期类用日期选择器，金额类用数字，列表类用列表                                                                                                                                                                                                                                       |
| `SIM 卡总览.base`      | Bases 表格，列出所有卡                                                                                                                                                                                                                                                                         |

Templater 设置：模板文件夹 `模板`，打开「Trigger Templater on new file creation」，文件夹模板 `卡片` → `模板/SIM 卡.md`。

### 属性和表格

```markdown
---
运营商: Harbour Mobile
号码: "+852 5555 0456"
国家: 🇭🇰 中国香港
类型: 实体 SIM
保号方式: [充值余额]
续费周期: 1 年
续费金额: 18
币种: HKD
下次续费（手动）: 2026-11-01 ~ 2026-11-20
---

| 日期       | 类型          | 金额 | 币种 | 汇率 | 有效期延至 | 备注 |
| ---------- | ------------- | ---- | ---- | ---- | ---------- | ---- |
| 2025-03-02 | 首次购买/开卡 | 48   | HKD  | 0.92 | 2025-11-15 |      |
| 2025-11-10 | 续费/保号     | 18   | HKD  | 0.91 | 2026-11-15 |      |
```

属性（只有「运营商」必填）：

| 属性                                                   | 说明                                                                                  | 公开          |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------- | ------------- |
| 运营商                                                 | 卡片标题、Logo 匹配都用它                                                             | 是            |
| 号码                                                   | 建议带引号写成 `"+852 ..."`；公开页只显示后 4 位                                      | 只显示后 4 位 |
| 国家                                                   | 国旗 + 名称，如 `🇭🇰 中国香港`，地球按国旗落点                                         | 是            |
| 类型                                                   | 含「实体」「卡托/贴片」「eSIM」「虚拟」等字样，决定图标和颜色                         | 只公开分类    |
| 颜色                                                   | 可选：`blue`、`green`、`purple` 等，覆盖默认颜色                                      | 是            |
| 保号方式                                               | 列表；`充值余额`、`有效使用（含收发短信）`、`自动扣费`、`购买续费套餐` 等会翻译成英文 | 是            |
| 续费周期                                               | `180 天`、`1 年`、`3 个月` 或纯数字（天）                                             | 是            |
| 续费金额、币种                                         | 币种写三位代码，如 `HKD`                                                              | 是            |
| 下次续费（手动）                                       | 可选；单个日期或 `开始 ~ 结束` 的续费窗口，填了就以它为准                             | 是            |
| 停用日期                                               | 填了就算已注销                                                                        | 是            |
| 首次购买日期                                           | 可选；不填取最早一条记录的日期                                                        | 是            |
| 设备、余额、余额更新日期、绑定服务、管理账号、扣款账户 | 只给站长看                                                                            | 否            |

续费表格：笔记正文里第一张含「日期」列的表。列名可以是 `日期`、`类型`、`金额`、`币种`、`汇率`、`有效期延至`、`备注`、`扣款账户`（英文 `Date`、`Type`、`Amount`、`Currency`、`Rate`、`Extends To`、`Note`、`Account` 也行）。

原来 Notion 公式算的东西，现在在 `worker/cards.ts` 里算：

- **当前有效期**：消费日期最近的那条记录的「有效期延至」（同一天有多条取最晚的）。
- **状态**：填了停用日期 = 已注销；过了有效期 = 已过期；其余 = 使用中。
- **下次续费**：有手动值用手动值，否则等于当前有效期；已注销为空。
- **折合人民币**：金额 × 汇率；币种是 CNY 时汇率按 1。累计花费是所有记录之和。

同步时发现的问题（缺号码、外币没填汇率、没有任何「有效期延至」、已过期等）会列在后台，卡片照常显示。没有属性区或没写运营商的笔记会被跳过，也列在后台。

运营商 Logo 放在库里的 `logos/` 文件夹（`LOGOS_FOLDER`），文件名按运营商名匹配，忽略大小写、空格和标点；支持 png、webp、jpg、svg。

## 本地运行

需要 Node.js 22.18 以上。

```bash
npm install
```

```bash
npm run dev:worker
```

会先构建前端，再用 `wrangler dev` 在 <http://127.0.0.1:8790> 跑起整站（R2、KV 都是本地模拟的，数据在 `.wrangler/`）。没有同步过时首页显示演示数据。

想在本地当站长（看私密字段、点同步），在项目根目录建 `.dev.vars`（已在 `.gitignore` 里），只对 localhost 生效：

```bash
printf 'DEV_ADMIN_EMAIL=dev@localhost\n' > .dev.vars
```

往本地 R2 放测试笔记：

```bash
npx wrangler r2 object put "esim-notes/卡片/Harbour Mobile 0456.md" --file "Harbour Mobile 0456.md" --local
```

注意：本地的 `r2 object put` 会把中文和空格编码成 `%E5...`、`%20` 存进去。Worker 读的时候会先解码再匹配文件夹，所以不影响。

改前端时可以另开一个终端跑 `npm run dev`（Vite 热更新，`/api` 和 `/logos` 转发到 8790）。

## 检查

提交前跑：

```bash
npm run check
```

依次跑 ESLint、`vue-tsc --build`（前端、Worker、Vite 配置三套 tsconfig）、`vite build`。没有单元测试，改了同步或计算逻辑要用上面的本地运行实际点一遍。

## 部署

线上在 <https://sim.arcueidblog.top>。Cloudflare 资源（R2 `esim-notes`、KV `simerald-store`、Access 应用）的现行配置写在运维手册的「SIM 卡片墙」页，这里只写怎么发布：

```bash
npx wrangler deploy --dry-run
```

```bash
npm run deploy
```

`npm run deploy` 先跑 `npm run check`，再 `wrangler deploy`，并把当前提交号写进 `GIT_HASH`。`ACCESS_TEAM_DOMAIN`、`ACCESS_AUD` 为空时没有人能进后台。Remotely Save 要用只能访问 `esim-notes` 的 R2 密钥，**不要开加密**（Worker 要能读）。

## 目录

- `worker/`：Cloudflare Worker
  - `index.ts`：入口和 API（`/api/site`、`/api/cards`、`/api/admin/status`、`/api/admin/theme`、`/api/admin/sync`、`/logos/*`）
  - `access.ts`：校验 Cloudflare Access 登录令牌（请求头或 `CF_Authorization` cookie，按团队公钥验签、核对 aud/iss/过期时间）
  - `bucket.ts`：按文件夹列 R2 里的文件（键名解码后再匹配）
  - `obsidian.ts`：解析笔记的属性区和续费表格
  - `cards.ts`：笔记 → 卡片，替代原来的 Notion 公式；`withToday` 每次请求重算状态
  - `sync.ts`：「同步笔记」：读全部笔记、写 KV 快照和同步状态
  - `view.ts`：公开接口的字段白名单
  - `settings.ts`：主题设置、卡片 ID 密钥（KV）
  - `logos.ts`、`demo.ts`、`vocab.ts`、`errors.ts`、`env.ts`
- `src/`：Vue 前端（见 [`src/AGENTS.md`](src/AGENTS.md)）
- `shared/`：前后端共用的类型和主题设置表
- `public/_headers`：静态页面的安全响应头
- `docs/obsidian-template/`：放进 ESIM 库的 Templater 模板、下拉选项、属性类型和 Bases 总览

## 发布记录

### 2026-11-09 首次上线

- 部署到 `sim.arcueidblog.top`（Worker 自定义域名），建 R2 存储桶 `esim-notes`、KV `simerald-store`，Access 应用保护 `/admin` 和 `/api/admin`。
- 实测：
  - 没登录访问后台接口会被 Access 跳到登录页；带伪造 cookie 不算登录。
  - 站长登录后在后台点「同步笔记」成功，读进 1 张真实卡片，后台列出了 2 处要检查的地方。
  - 公开接口只返回号码后 4 位，没有私密字段。
  - Remotely Save 把文件放在桶根目录、键名不编码，`CARDS_FOLDER` 用 `卡片` 正确。
- 还没验证：站长登录后在首页能否看到完整号码（取决于 Access 的 cookie 是否发到 `/admin` 以外的路径）。

### 2026-11-08 改造为 Obsidian + Cloudflare Workers

- 基于上游 v0.3.0（`471ca76`）。
- 去掉 Notion 同步、字段映射、模板生成器，自写登录（scrypt + TOTP + 恢复码），Node 服务器和 Docker 部署。
- 新增 Worker 后端：R2 读笔记、KV 存快照、Cloudflare Access 登录、后台「同步笔记」按钮和问题列表。
- 本地 `wrangler dev` 实测：3 篇示例笔记 + 1 篇坏笔记，同步结果、状态和下次续费计算、Logo、跳过坏笔记都符合预期；访客接口不含号码、账户、备注、文件名；未登录访问后台接口返回 401；伪造或过期、aud/iss/签名不对的 Access 令牌都被拒绝（用本地假公钥服务器签的令牌测试）。

## 致谢与协议

- 原项目 [SIMerald](https://github.com/BurningSky0306/simerald)（BurningSky0306）
- 界面派生自 [Komari Emerald](https://github.com/Tokinx/komari-theme-emerald)（Tokinx）
- 国旗图标来自 [Twemoji](https://github.com/jdecked/twemoji)（CC-BY 4.0）

[MIT](LICENSE)
