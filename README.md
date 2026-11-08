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

每张卡一篇笔记，放在库里的 `卡片/` 文件夹（文件夹名由 `wrangler.jsonc` 的 `CARDS_FOLDER` 决定）。模板在 [`docs/obsidian-template/模板/SIM 卡.md`](docs/obsidian-template/模板/SIM%20卡.md)，总览表在 [`docs/obsidian-template/SIM 卡总览.base`](docs/obsidian-template/SIM%20卡总览.base)。

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

## 部署（尚未执行）

以下步骤还没在线上跑过，是计划：

1. 在 Cloudflare 建 R2 存储桶 `esim-notes` 和一个 KV 命名空间，把 KV 的 id 填进 `wrangler.jsonc`（现在是全 0 的占位）。
2. 在 Zero Trust → Access 建一个自托管应用，保护 `sim.arcueidblog.top/admin` 和 `sim.arcueidblog.top/api/admin`，只允许站长邮箱；把团队域名和应用的 AUD 填进 `wrangler.jsonc` 的 `ACCESS_TEAM_DOMAIN`、`ACCESS_AUD`。这两项留空时，没有人能进后台。
3. `npm run deploy`（先跑 `npm run check`，再 `wrangler deploy`，自定义域名 `sim.arcueidblog.top` 会自动绑定）。
4. 手机和 Mac 的 Obsidian 在 ESIM 库里装 Remotely Save，选 S3 兼容、填 R2 地址和一个只能访问 `esim-notes` 的 R2 密钥，**不要开加密**（Worker 要能读）。如果插件把文件放在库名前缀下，改 `CARDS_FOLDER` / `LOGOS_FOLDER`。

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
- `docs/obsidian-template/`：放进 ESIM 库的模板笔记和 Bases 总览

## 发布记录

### 2026-11-08 改造为 Obsidian + Cloudflare Workers（未部署）

- 基于上游 v0.3.0（`471ca76`）。
- 去掉 Notion 同步、字段映射、模板生成器，自写登录（scrypt + TOTP + 恢复码），Node 服务器和 Docker 部署。
- 新增 Worker 后端：R2 读笔记、KV 存快照、Cloudflare Access 登录、后台「同步笔记」按钮和问题列表。
- 本地 `wrangler dev` 实测：3 篇示例笔记 + 1 篇坏笔记，同步结果、状态和下次续费计算、Logo、跳过坏笔记都符合预期；访客接口不含号码、账户、备注、文件名；未登录访问后台接口返回 401；伪造或过期、aud/iss/签名不对的 Access 令牌都被拒绝（用本地假公钥服务器签的令牌测试）。
- 还没有：线上部署、真实 Access 登录、Remotely Save 同步到 R2 的实测。

## 致谢与协议

- 原项目 [SIMerald](https://github.com/BurningSky0306/simerald)（BurningSky0306）
- 界面派生自 [Komari Emerald](https://github.com/Tokinx/komari-theme-emerald)（Tokinx）
- 国旗图标来自 [Twemoji](https://github.com/jdecked/twemoji)（CC-BY 4.0）

[MIT](LICENSE)
