/**
 * Simplified Chinese UI strings: the source dictionary. Its shape is the message schema that
 * `en.ts` must match. vue-i18n syntax: `{name}` interpolates, `|` separates plural forms
 * (`t(key, n)` exposes `n` as `{n}`), and `{ } @ $ |` must be escaped as `{'@'}` when meant literally.
 *
 * `keepAlive`, `recordKinds` and `cycle` use the option names of the Chinese Notion template, so
 * a Chinese site connected to the Chinese template reads exactly as written in Notion.
 */
export default {
  common: {
    listSeparator: '、',
    noData: '暂无数据',
    backToTop: '返回顶部',
    backHome: '返回首页',
    close: '关闭',
    cancel: '取消',
    save: '保存',
    saveFailed: '保存失败',
    copyFailed: '复制失败，请手动抄写',
  },

  header: {
    theme: {
      auto: '自动主题',
      light: '浅色主题',
      dark: '深色主题',
    },
    // Names the language the toggle switches to, written in that language
    switchLanguage: 'English',
    admin: '后台管理',
  },

  footer: {
    demo: '演示数据',
    syncedAt: '数据更新于 {time}',
    notSynced: '数据尚未同步',
  },

  home: {
    allNumbers: '全部号码',
    cardStyle: '卡片样式',
    cardStyleTitle: '{style}样式',
    searchPlaceholder: '搜索运营商、国家、号码后 4 位',
    connectionErrorTitle: '连接服务器失败',
    connectionErrorBody: '请检查网络设置或刷新页面后再试。',
    demoTitle: '当前显示的是演示数据',
    demoBody: '站长还没有连接 Notion，下面的号码和运营商都是虚构的。',
    demoConnect: '去后台连接 Notion',
    demoGuide: '查看接入教程',
    noMatch: '没有找到匹配的号码',
    empty: '暂无号码',
  },

  continents: {
    asia: '亚洲',
    europe: '欧洲',
    northAmerica: '北美洲',
    southAmerica: '南美洲',
    africa: '非洲',
    oceania: '大洋洲',
    antarctica: '南极洲',
    other: '其他',
  },

  cardStyles: {
    namecard: '名片',
    dial: '表盘',
    bar: '横条',
  },

  cardKinds: {
    physical: '实体 SIM',
    adapter: 'eSIM 卡托',
    embedded: '手机内置 eSIM',
    virtual: '虚拟号码',
  },

  status: {
    active: '使用中',
    expired: '已过期',
    cancelled: '已注销',
    // Fits inside the dial ring
    short: {
      expired: '过期',
      cancelled: '注销',
    },
  },

  keepAlive: {
    topup: '充值余额',
    addon: '购买/启用增值服务',
    use: '有效使用（含收发短信）',
    balanceChange: '产生余额变动（如发漫游短信）',
    autoCharge: '自动扣费',
    plan: '购买续费套餐',
  },

  recordKinds: {
    purchase: '首次购买/开卡',
    renewal: '续费/保号',
    topup: '额外充值',
    other: '其他',
  },

  cycle: {
    every: '每 {n} 天',
    varies: '不固定（取决于充值/服务组合）',
  },

  billingPeriod: {
    monthly: '月',
    quarterly: '季',
    semi_annual: '半年',
    annual: '年',
    biennial: '两年',
    triennial: '三年',
    quinquennial: '五年',
  },

  days: {
    count: '{n} 天',
    overdue: '过期 {n} 天',
    today: '今天',
    // Unit shown under or after a bare number
    unit: '天',
  },

  validity: {
    cancelledOn: '{date} 注销',
    noRecord: '没有有效期记录',
    tooltip: '本期 {total}，还剩 {left} · 至 {end}',
  },

  keepCost: {
    noMethod: '未记录保号方式',
    variesShort: '不固定',
    varies: '周期不固定',
    freeShort: '免费',
    free: '免费保号',
    freeEvery: '每 {n} 天免费',
    perYear: '{amount}/年',
    perCycle: '{amount} / {days}',
  },

  balance: {
    none: '未记录余额',
    noUpdateDate: '未记录更新时间',
    updatedToday: '今天更新',
    updatedDaysAgo: '{days}前更新',
  },

  hold: {
    noDate: '未记录入手日期',
    since: '{date} 入手',
  },

  card: {
    uncategorized: '未分类',
    firstPurchase: '首次购买 {amount}',
    heldFor: '已持有 {days}',
    remaining: '剩余',
    keepPerYear: '每年保号',
    validity: '有效期',
    until: '至 {date}',
    thisPeriod: '本期 {days}',
    rows: {
      expiry: '到期',
      purchase: '购入',
      keep: '保号',
    },
  },

  summary: {
    activeNumbers: '在用号码',
    cardUnit: '张',
    countries: '覆盖国家或地区',
    countryUnit: '个',
    totalValue: '总价值',
    monthlyCost: '月均支出',
    perMonth: '{currency}/月',
    remainingValue: '剩余价值',
    todayRates: '今日汇率',
    rateBaseCurrency: '切换汇率基准币种',
    totalSpent: '累计花费',
    spendPurchase: '首购',
    spendRenewal: '续费',
    spendOther: '其他',
    upcomingWithin: '{days}内续费',
    noUpcoming: '{days}内没有要续费的号码',
    nextRenewal: '即将续费',
    overdueUnit: '天前到期',
    inDaysUnit: '天后',
  },

  globe: {
    activeCards: '{n} 张',
    days: '{n}天',
    mapLoadFailed: '地图资源加载失败',
  },

  detail: {
    notFound: '号码不存在或已被删除',
    backHome: '返回首页',
    totalSpent: '累计花费 {amount}',
    free: '免费',
    notApplicable: '不适用',
    perMonth: '{currency} / 月',
    locked: '登录后可见',
    noIssues: '没有问题',
    metrics: {
      price: '续费价格',
      monthly: '月均支出',
      remaining: '剩余时间',
      remainingValue: '剩余价值',
    },
    sections: {
      number: '号码信息',
      keepAlive: '保号信息',
      balance: '余额信息',
      account: '账号信息',
    },
    fields: {
      number: '号码',
      country: '国家/地区',
      type: '卡片类型',
      device: '使用设备',
      keepAlive: '保号方式',
      cycle: '续费周期',
      nextRenewal: '下次续费',
      expiresAt: '有效期至',
      balance: '当前余额',
      balanceUpdatedAt: '余额更新',
      held: '已持有',
      account: '管理账号',
      paymentAccounts: '扣款账户',
      services: '绑定的服务',
      dataCheck: '数据检查',
    },
  },

  history: {
    title: '续费历史',
    count: '{n} 笔',
    empty: '还没有消费记录',
    free: '免费',
    extendsTo: '有效期延至 {date}',
    legend: {
      purchase: '首次购买',
      renewal: '续费 / 保号',
      topup: '额外充值',
      other: '其他',
    },
    columns: {
      date: '日期',
      type: '类型',
      amount: '金额',
      amountCNY: '等额人民币',
      extendsTo: '有效期延至',
      accounts: '扣款账户',
    },
  },

  visitor: {
    anonymous: '网络访客',
    unknownLocation: '未知位置',
    ipUnavailable: '暂无法获取',
    networkUnavailable: '网络信息不可用',
    unknownIsp: '未知运营商',
    unknownBrowser: '未知浏览器',
    devices: {
      desktop: '桌面设备',
      android: 'Android 手机',
      iphone: 'iPhone',
      ipad: 'iPad',
      tablet: '平板电脑',
    },
  },

  admin: {
    title: '后台管理',
    logout: '退出登录',
    loggedOut: '已退出登录',
    loading: '正在读取…',
    loadFailed: '读取失败，请刷新页面',
    statusLoadFailed: '读取后台状态失败',
  },

  login: {
    title: '站长登录',
    password: '密码',
    totp: '两步验证',
    remember: '在这台设备上保持登录 {days} 天',
    submit: '登录',
    failed: '登录失败',
  },

  setup: {
    failed: '设置失败',
    verifyFailed: '验证失败',
    passwordMismatch: '两次输入的密码不一样',
    step1: {
      title: '首次设置 · 第 1 步：设置密码',
      description: 'SIMerald 还没有站长账号。为了防止别人抢先设置，需要输入服务器上生成的一次性设置密钥：在服务器上运行 docker logs simerald 能看到，也保存在数据目录的 setup-key.txt 里。',
      setupKey: '设置密钥',
      setupKeyHelp: '格式类似 ABCD-EFGH-IJKL',
      password: '站长密码',
      passwordHelp: '至少 {min} 位，建议用密码管理器生成',
      passwordConfirm: '再输一次密码',
      next: '下一步',
    },
    step2: {
      title: '首次设置 · 第 2 步：绑定两步验证',
      description: '以后登录除了密码，还要输入手机验证器 App 上的 6 位数字，这个数字每 30 秒变一次。',
      code: 'App 上显示的 6 位数字',
      submit: '验证并完成',
    },
    step3: {
      title: '首次设置 · 第 3 步：保存恢复码',
      saved: '我已经把恢复码保存好了',
      enter: '进入后台',
    },
  },

  recovery: {
    notice: '这些恢复码只显示这一次。手机丢了、验证器 App 打不开时，可以用其中一个代替 6 位验证码登录，每个只能用一次。请保存到密码管理器或打印出来。',
    copyAll: '复制全部',
    download: '下载为文本文件',
    copied: '恢复码已复制',
    fileHeader: 'SIMerald 恢复码（每个只能用一次）',
  },

  totp: {
    scan: '用手机上的验证器 App（Google Authenticator、Microsoft Authenticator、1Password 等）扫描左边的二维码。',
    manual: '扫不了的话，在 App 里选「手动输入密钥」，填下面这串：',
    copySecret: '复制密钥',
    secretCopied: '密钥已复制',
  },

  security: {
    title: '账号安全',
    recoveryLeft: '剩余恢复码',
    recoveryCount: '{n} 个',
    sessions: '已登录的设备',
    sessionCount: '{n} 台',
    changePassword: '修改密码',
    rebind: '重新绑定两步验证',
    regenerate: '重新生成恢复码',
    logoutOthers: '退出其他设备',
    savedDone: '我已保存，完成',
    newCode: '新 App 上显示的 6 位数字',
    verifyReplace: '验证并替换',
    hints: {
      password: '修改密码后，其他设备会被退出登录。',
      rebind: '换手机或重装验证器 App 时使用。完成后旧的验证码和恢复码都会作废。',
      recovery: '旧的恢复码会全部作废。',
    },
    currentPassword: '当前密码',
    code: '验证码',
    codeHelp: '验证器 App 上的 6 位数字，或一个恢复码',
    newPassword: '新密码',
    newPasswordHelp: '至少 {min} 位',
    newPasswordConfirm: '再输一次新密码',
    submit: {
      password: '修改密码',
      rebind: '下一步',
      recovery: '生成新的恢复码',
    },
    failed: '操作失败',
    passwordMismatch: '两次输入的新密码不一样',
    passwordChanged: '密码已修改，其他设备已退出登录',
    rebound: '两步验证已重新绑定，旧手机上的验证码已失效',
    othersLoggedOut: '其他设备已退出登录',
  },

  theme: {
    title: '主题设置',
    description: '保存后访客刷新页面就能看到。',
    save: '保存主题设置',
    saved: '主题设置已保存',
  },

  sync: {
    title: '数据同步',
    description: 'SIMerald 每天从 Notion 拉取一次数据。在 Notion 里改完想马上看到，点「立即同步」。',
    syncNow: '立即同步',
    status: '状态',
    cards: '卡片',
    cardCount: '{n} 张',
    records: '消费记录',
    recordCount: '{n} 条',
    lastSuccess: '上次成功',
    nextRun: '下次自动同步',
    dailyTime: '每天同步时间',
    timezone: '时区',
    saveSchedule: '保存时间',
    scheduleSaved: '同步时间已保存',
    failed: '同步失败',
    failedWith: '同步失败：{error}',
    done: '同步完成：{cards}卡，{records}消费记录',
    errorAt: '{time}：{error}',
    state: {
      notConnected: '未连接 Notion（正在显示演示数据）',
      running: '正在同步…',
      failed: '上次同步失败',
      ok: '同步正常',
      never: '还没有同步过',
    },
    issues: {
      title: '有 {n} 个字段对不上，对应的信息不会显示。改 Notion 列名，或在「Notion 连接」里换字段预设 / 自定义映射：',
      missing: '：找不到这一列',
      type: '：类型是 {actual}，应为 {expected}',
      legend: '● 影响首页显示 ○ 只影响站长可见的信息',
      db: {
        cards: 'SIM 卡库',
        records: '消费记录库',
      },
    },
  },

  notion: {
    title: 'Notion 连接',
    description: 'SIMerald 只读取 Notion，不会修改里面的任何内容。',
    steps: {
      copy: '1. 把 SIMerald 的 Notion 模板复制到你的工作区（模板链接和详细步骤见{guide}）。',
      guide: '接入教程',
      integration: '2. 打开 notion.so/profile/integrations，新建一个 Internal integration，权限只勾「读取内容」，复制它的 token。',
      connect: '3. 在 Notion 里打开模板页面，点右上角 ··· →「连接」，选中刚建的 integration。',
      detect: '4. 把 token 填到下面，点「自动识别」，确认识别结果后点「保存」，会立即同步一次。',
    },
    token: {
      help: 'token 只保存在服务器上，不会再显示出来',
      configured: '已配置。留空表示不修改；填新的会覆盖旧的',
      fromEnv: 'token 来自服务器的环境变量，这里不能修改',
      configuredPlaceholder: '••••••••（已配置）',
      clear: '删除已保存的 token（删除后会显示演示数据）',
    },
    detect: {
      button: '自动识别',
      running: '识别中…',
      choose: '找到 {n} 套模板，选择要连接的那一套：',
      found: '已识别{preset}：{databases}。点「保存」完成连接',
      recordsMissing: '找到了 SIM 卡库，但没找到关联的消费记录库，请确认它也「连接」给了这个 integration',
      none: '没找到 SIMerald 模板。请确认已复制模板，并在模板页面右上角 ··· →「连接」里选中了这个 integration',
      failed: '自动识别失败',
      cardsFallback: 'SIM 卡',
      noRecords: '（没找到消费记录库）',
      accountsFallback: '支付账户',
    },
    databases: {
      cards: 'SIM 卡数据库',
      records: '消费记录数据库',
      accounts: '扣款账户数据库（可选）',
      help: '数据库链接或 ID',
      accountsHelp: '用来显示扣款账户名称',
      optional: '可留空',
    },
    preset: '字段预设',
    presetHelp: '复制官方模板时选对应语言即可；数据库列名和模板不一样时选「自定义映射」。',
    presets: {
      zh: '中文模板',
      en: 'English template',
      custom: '自定义映射（JSON）',
    },
    mapping: '字段映射 JSON',
    mappingHelp: '在中文模板的基础上覆盖：左边是 SIMerald 的字段，右边是你 Notion 数据库里的列名。只需要写和中文模板不一样的部分。',
    save: {
      running: '正在保存并同步…',
      saved: '已保存',
      synced: '已保存并完成同步',
      syncFailed: '已保存，但同步失败：{error}',
      fieldIssues: '已保存并完成同步，但有 {n} 个字段对不上，详见「数据同步」',
    },
  },

  // Theme settings panel; field keys match shared/settings-schema.ts
  settings: {
    sections: {
      basic: '基础设置',
      alert: '公告设置',
      page: '页面设置',
      icp: '备案设置',
      background: '自定义背景',
    },
    fields: {
      sitename: {
        name: '站点标题',
        help: '显示在页面左上角和浏览器标签上',
      },
      defaultLanguage: {
        name: '默认语言',
        help: '访客第一次打开时的界面语言；「跟随浏览器」按访客浏览器的语言选择中文或英文。访客可以在右上角自己切换，浏览器会记住',
        options: {
          'auto': '跟随浏览器',
          'zh-CN': '简体中文',
          'en': 'English',
        },
      },
      defaultCardStyle: {
        name: '默认卡片样式',
        help: '访客第一次打开时看到的卡片样式；访客可以在首页右上角自己切换，浏览器会记住',
        options: {
          namecard: '名片',
          dial: '表盘',
          bar: '横条',
        },
      },
      defaultSort: {
        name: '默认排序',
        help: '卡片墙的默认顺序',
        options: {
          renewal: '按下次续费日期',
          notion: '按 Notion 顺序',
          name: '按名称',
          country: '按国家/地区',
        },
      },
      alertEnabled: {
        name: '启用公告',
        help: '在首页显示自定义公告',
      },
      alertTitle: {
        name: '公告标题',
        help: '公告的标题内容',
      },
      alertContent: {
        name: '公告内容',
        help: '公告的详细内容（支持简单 Markdown 格式）',
      },
      earthViewMode: {
        name: '头部展示模式',
        options: {
          'earth': '自转地球',
          'earth-stop': '静止地球',
          'maps': '点状地图',
          'cards': '仅显示头部卡片',
          'hide': '隐藏整个头部',
        },
      },
      visitorInfoCardEnabled: {
        name: '访客信息卡片',
        help: '显示访客来源、设备和浏览器信息卡片',
      },
      hideAdminEntryWhenLoggedOut: {
        name: '隐藏后台入口',
        help: '未登录时隐藏顶部后台管理入口',
      },
      disablePageAnimation: {
        name: '减弱过渡动画',
        help: '减少页面过渡动画效果，提升访问速度和响应性',
      },
      cancelledLast: {
        name: '已注销后置',
        help: '开启后已注销的号码排到最后',
      },
      icpEnabled: {
        name: '显示备案号',
        help: '在页脚显示网站备案号',
      },
      icpNumber: {
        name: '备案号',
        help: '网站备案号（如：京ICP备12345678号）',
      },
      icpUrl: {
        name: '备案跳转链接',
        help: '点击备案号跳转的链接地址',
      },
      policeEnabled: {
        name: '显示公安备案',
        help: '在页脚显示公安备案信息',
      },
      policeNumber: {
        name: '公安备案号',
        help: '公安备案号（如：京公网安备 11010502000000号）',
      },
      policeUrl: {
        name: '公安备案跳转链接',
        help: '点击公安备案号跳转的链接地址，留空则不跳转',
      },
      backgroundEnabled: {
        name: '启用自定义背景',
        help: '启用后可设置自定义图片或视频作为页面背景',
      },
      backgroundType: {
        name: '背景类型',
        options: {
          image: '图片',
          video: '视频',
        },
      },
      lightBackgroundUrl: {
        name: '亮色模式背景地址',
        help: '亮色模式下的背景图片/视频 URL',
      },
      darkBackgroundUrl: {
        name: '暗色模式背景地址',
        help: '暗色模式下的背景图片/视频 URL',
      },
      backgroundBlur: {
        name: '背景模糊半径',
        help: '背景的高斯模糊半径（单位：px），0 表示不模糊',
      },
      backgroundOverlay: {
        name: '背景遮罩强度',
        help: '负数降低背景透明度，0 表示关闭，正数为黑色遮罩，绝对值越大效果越明显',
      },
    },
  },

  // API and sync errors, keyed by the codes in server/*.ts (AppError / NotionError)
  errors: {
    retryIn: '{message}（约 {minutes} 分钟后）',
    http: {
      network: '连接服务器失败，请检查网络',
      requestFailed: '请求失败（{status}）',
      unsupportedMediaType: '请求格式不对',
      payloadTooLarge: '请求内容太大',
      badJson: '请求内容不是合法的 JSON',
      badUrl: '网址格式不对',
      csrf: '请求来源校验失败',
      notFound: '接口不存在',
      methodNotAllowed: '不支持的请求方法',
      internal: '服务器内部错误',
    },
    auth: {
      loginRequired: '请先登录',
      passwordTooShort: '密码至少 {min} 位',
      passwordTooLong: '密码太长',
      tooManyAttempts: '尝试次数过多，请稍后再试',
      badCredentials: '密码或验证码错误',
      setupInvalid: '设置流程已失效，请重新开始',
      setupExpired: '设置流程已超时，请重新开始',
      alreadySetUp: '站长账号已经设置过了',
      badSetupKey: '设置密钥不正确',
      badTotp: '验证码不正确，请确认手机时间准确后重试',
      setupRequired: '请先完成首次设置',
    },
    notion: {
      tokenRequired: '请先填写 Notion token',
      badToken: 'Notion token 格式不对',
      unauthorized: 'Notion token 无效或已被撤销',
      forbidden: 'Notion integration 没有读取权限',
      notFound: '找不到数据库：ID 不对，或者没有把页面共享给这个 integration',
      rateLimited: 'Notion 请求太频繁，请稍后再试',
      apiError: 'Notion 接口出错（{status} {code}）：{message}',
      network: '连不上 Notion：{message}',
      noDataSource: '这个数据库里没有数据源',
    },
    settings: {
      badSyncTime: '同步时间格式应为 HH:mm，例如 05:00',
      badTimezone: '时区无效，例如 Asia/Shanghai',
      badDatabaseId: '数据库 ID 格式不对：{value}',
      badMapping: '字段映射不是合法的 JSON',
    },
    sync: {
      noToken: '还没有配置 Notion token',
      noDatabases: '还没有填写 SIM 卡数据库和消费记录数据库的 ID',
      accountsSkipped: '扣款账户数据库读取失败，已跳过（扣款账户名称不会显示）：{cause}',
      failed: '同步失败：{message}',
    },
  },
}
