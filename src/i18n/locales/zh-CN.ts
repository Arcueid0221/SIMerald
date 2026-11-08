/**
 * Simplified Chinese UI strings: the source dictionary. Its shape is the message schema that
 * `en.ts` must match. vue-i18n syntax: `{name}` interpolates, `|` separates plural forms
 * (`t(key, n)` exposes `n` as `{n}`), and `{ } @ $ |` must be escaped as `{'@'}` when meant literally.
 *
 * `keepAlive`, `recordKinds` and `cycle` use the same labels as the card note template, so a Chinese
 * site reads exactly as written in the notes.
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
    demoBody: '站长还没有同步过笔记，下面的号码和运营商都是虚构的。',
    demoSync: '去后台同步笔记',
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
    loading: '正在读取…',
    loadFailed: '读取失败，请刷新页面',
    statusLoadFailed: '读取后台状态失败',
    signIn: {
      title: '需要登录',
      expiredTitle: '登录已过期',
      description: '后台由 Cloudflare Access 保护，点下面的按钮后输入站长邮箱，收到验证码就能进来。',
      button: '去登录',
    },
  },

  theme: {
    title: '主题设置',
    description: '保存后访客刷新页面就能看到。',
    save: '保存主题设置',
    saved: '主题设置已保存',
  },

  sync: {
    title: '同步笔记',
    description: '在 Obsidian 里改完卡片，先让 Remotely Save 把笔记传到 R2，再点「同步笔记」。读取的是存储桶里「{folder}」文件夹下的笔记。',
    syncNow: '同步笔记',
    status: '状态',
    cards: '卡片',
    cardCount: '{n} 张',
    records: '续费记录',
    recordCount: '{n} 条',
    lastSuccess: '上次成功',
    failed: '同步失败',
    failedWith: '同步失败：{error}',
    done: '同步完成：{cards}卡，{records}续费记录',
    errorAt: '{time}：{error}',
    state: {
      running: '正在同步…',
      failed: '上次同步失败',
      ok: '同步正常',
      never: '还没有同步过（首页正在显示演示数据）',
    },
    issues: {
      skippedTitle: '有 {n} 篇笔记没读进来：',
      warningsTitle: '有 {n} 处需要检查（卡片已显示）：',
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
          manual: '按笔记文件名',
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

  // API and sync errors, keyed by the codes in worker/*.ts (AppError / NoteError)
  errors: {
    http: {
      network: '连接服务器失败，请检查网络',
      requestFailed: '请求失败（{status}）',
      unsupportedMediaType: '请求格式不对',
      payloadTooLarge: '请求内容太大',
      badJson: '请求内容不是合法的 JSON',
      csrf: '请求来源校验失败',
      notFound: '接口不存在',
      methodNotAllowed: '不支持的请求方法',
      internal: '服务器内部错误',
    },
    auth: {
      loginRequired: '请先通过 Cloudflare Access 登录',
    },
    note: {
      noFrontmatter: '笔记开头没有属性区（--- ... ---）',
      badFrontmatter: '属性区格式不对：{message}',
      noCarrier: '缺「{property}」属性',
      ignoredProperty: '属性「{name}」的值读不懂，已忽略',
      vanished: '同步时笔记不见了',
      check: '{problem}',
    },
    sync: {
      failed: '同步失败：{message}',
    },
  },
}
