/**
 * English UI strings; must provide every key of `zh-CN.ts` (enforced by `MessageSchema`).
 * `keepAlive`, `recordKinds` and `cycle` use the English labels the card notes may use.
 */
import type { MessageSchema } from '@/i18n'

const en: MessageSchema = {
  common: {
    listSeparator: ', ',
    noData: 'No data',
    backToTop: 'Back to top',
    backHome: 'Back to home',
    close: 'Close',
    cancel: 'Cancel',
    save: 'Save',
    saveFailed: 'Failed to save',
    copyFailed: 'Copy failed; please copy it manually',
  },

  header: {
    theme: {
      auto: 'System theme',
      light: 'Light theme',
      dark: 'Dark theme',
    },
    switchLanguage: '中文',
    admin: 'Admin',
  },

  footer: {
    demo: 'Demo data',
    syncedAt: 'Updated {time}',
    notSynced: 'Data not synced yet',
  },

  home: {
    allNumbers: 'All numbers',
    cardStyle: 'Card style',
    cardStyleTitle: '{style} view',
    searchPlaceholder: 'Search carrier, country, or last 4 digits',
    connectionErrorTitle: 'Failed to connect to server',
    connectionErrorBody: 'Please check your network settings or refresh the page and try again.',
    demoTitle: 'Currently showing demo data',
    demoBody: 'The owner has not synced any notes yet. The numbers and carriers below are fictional. ',
    demoSync: 'Sync notes in Admin',
    noMatch: 'No matching numbers found',
    empty: 'No numbers yet',
  },

  continents: {
    asia: 'Asia',
    europe: 'Europe',
    northAmerica: 'North America',
    southAmerica: 'South America',
    africa: 'Africa',
    oceania: 'Oceania',
    antarctica: 'Antarctica',
    other: 'Other',
  },

  cardStyles: {
    namecard: 'Card',
    dial: 'Dial',
    bar: 'Bar',
  },

  cardKinds: {
    physical: 'Physical SIM',
    adapter: 'eSIM adapter',
    embedded: 'Built-in eSIM',
    virtual: 'Virtual number',
  },

  status: {
    active: 'Active',
    expired: 'Expired',
    cancelled: 'Cancelled',
    short: {
      expired: 'Expired',
      cancelled: 'Closed',
    },
  },

  keepAlive: {
    topup: 'Top up balance',
    addon: 'Buy or enable an add-on',
    use: 'Regular use (incl. SMS)',
    balanceChange: 'Balance change (e.g. roaming SMS)',
    autoCharge: 'Auto-charge',
    plan: 'Buy a renewal plan',
  },

  recordKinds: {
    purchase: 'Initial purchase',
    renewal: 'Renewal',
    topup: 'Extra top-up',
    other: 'Other',
  },

  cycle: {
    every: 'Every day | Every {n} days',
    varies: 'Varies (depends on top-ups or add-ons)',
  },

  billingPeriod: {
    monthly: 'mo',
    quarterly: 'qtr',
    semi_annual: '6 mo',
    annual: 'yr',
    biennial: '2 yr',
    triennial: '3 yr',
    quinquennial: '5 yr',
  },

  days: {
    count: '{n} day | {n} days',
    overdue: '{n} day overdue | {n} days overdue',
    today: 'Today',
    unit: 'day | days',
  },

  validity: {
    cancelledOn: 'Cancelled on {date}',
    noRecord: 'No validity record',
    tooltip: 'This cycle {total}, {left} left · until {end}',
  },

  keepCost: {
    noMethod: 'No keep-alive method recorded',
    variesShort: 'Varies',
    varies: 'Variable cycle',
    freeShort: 'Free',
    free: 'Free keep-alive',
    freeEvery: 'Free every day | Free every {n} days',
    perYear: '{amount}/yr',
    perCycle: '{amount} / {days}',
  },

  balance: {
    none: 'No balance recorded',
    noUpdateDate: 'No update date recorded',
    updatedToday: 'Updated today',
    updatedDaysAgo: 'Updated {days} ago',
  },

  hold: {
    noDate: 'No purchase date recorded',
    since: 'Held since {date}',
  },

  card: {
    uncategorized: 'Uncategorized',
    firstPurchase: 'Initial purchase {amount}',
    heldFor: 'Held for {days}',
    remaining: 'Remaining',
    keepPerYear: 'Yearly cost',
    validity: 'Validity',
    until: 'Until {date}',
    thisPeriod: 'This cycle {days}',
    rows: {
      expiry: 'Expires',
      purchase: 'Purchased',
      keep: 'Keep-alive',
    },
  },

  summary: {
    activeNumbers: 'Active numbers',
    cardUnit: 'card | cards',
    countries: 'Countries & regions',
    countryUnit: 'country | countries',
    totalValue: 'Total value',
    monthlyCost: 'Monthly cost',
    perMonth: '{currency}/mo',
    remainingValue: 'Remaining value',
    todayRates: 'Today\'s rates',
    rateBaseCurrency: 'Switch base currency',
    totalSpent: 'Total spent',
    spendPurchase: 'Initial purchase',
    spendRenewal: 'Renewal',
    spendOther: 'Other',
    upcomingWithin: 'Due within {days}',
    noUpcoming: 'No renewals due within {days}',
    nextRenewal: 'Next renewal',
    overdueUnit: 'day overdue | days overdue',
    inDaysUnit: 'day left | days left',
  },

  globe: {
    activeCards: '{n} card | {n} cards',
    days: '{n}d | {n}d',
    mapLoadFailed: 'Failed to load map resources',
  },

  detail: {
    notFound: 'Number does not exist or has been deleted',
    backHome: 'Back to home',
    totalSpent: 'Total spent {amount}',
    free: 'Free',
    notApplicable: 'N/A',
    perMonth: '{currency} / mo',
    locked: 'Sign in to view',
    noIssues: 'No issues',
    metrics: {
      price: 'Renewal price',
      monthly: 'Monthly cost',
      remaining: 'Time remaining',
      remainingValue: 'Remaining value',
    },
    sections: {
      number: 'Number details',
      keepAlive: 'Keep-alive details',
      balance: 'Balance details',
      account: 'Account details',
    },
    fields: {
      number: 'Number',
      country: 'Country / region',
      type: 'Card type',
      device: 'Device',
      keepAlive: 'Keep-alive method',
      cycle: 'Renewal cycle',
      nextRenewal: 'Next renewal',
      expiresAt: 'Valid until',
      balance: 'Current balance',
      balanceUpdatedAt: 'Balance updated',
      held: 'Held for',
      account: 'Account login',
      paymentAccounts: 'Payment accounts',
      services: 'Linked services',
      dataCheck: 'Data check',
    },
  },

  history: {
    title: 'Renewal history',
    count: '{n} record | {n} records',
    empty: 'No expense records yet',
    free: 'Free',
    extendsTo: 'Extended to {date}',
    legend: {
      purchase: 'Initial purchase',
      renewal: 'Renewal / keep-alive',
      topup: 'Extra top-up',
      other: 'Other',
    },
    columns: {
      date: 'Date',
      type: 'Type',
      amount: 'Amount',
      amountCNY: 'CNY equivalent',
      extendsTo: 'Extended to',
      accounts: 'Payment accounts',
    },
  },

  visitor: {
    anonymous: 'Web visitor',
    unknownLocation: 'Unknown location',
    ipUnavailable: 'IP unavailable',
    networkUnavailable: 'Network info unavailable',
    unknownIsp: 'Unknown ISP',
    unknownBrowser: 'Unknown browser',
    devices: {
      desktop: 'Desktop',
      android: 'Android phone',
      iphone: 'iPhone',
      ipad: 'iPad',
      tablet: 'Tablet',
    },
  },

  admin: {
    title: 'Admin',
    logout: 'Sign out',
    loading: 'Loading…',
    loadFailed: 'Failed to load, please refresh the page',
    statusLoadFailed: 'Failed to load admin status',
    signIn: {
      title: 'Sign-in required',
      expiredTitle: 'Your sign-in has expired',
      description: 'The admin page is protected by Cloudflare Access. Click below, enter the owner\'s email and use the code you receive.',
      button: 'Sign in',
    },
  },

  theme: {
    title: 'Theme settings',
    description: 'Visitors will see the changes after refreshing the page.',
    save: 'Save theme settings',
    saved: 'Theme settings saved',
  },

  sync: {
    title: 'Sync notes',
    description: 'After editing cards in Obsidian, let Remotely Save upload the notes to R2, then click "Sync notes". Notes are read from the "{folder}" folder in the bucket.',
    syncNow: 'Sync notes',
    status: 'Status',
    cards: 'Cards',
    cardCount: '{n} card | {n} cards',
    records: 'Renewal records',
    recordCount: '{n} record | {n} records',
    lastSuccess: 'Last success',
    failed: 'Sync failed',
    failedWith: 'Sync failed: {error}',
    done: 'Sync complete: {cards}, {records}',
    errorAt: '{time}: {error}',
    state: {
      running: 'Syncing…',
      failed: 'Last sync failed',
      ok: 'Up to date',
      never: 'Never synced (the home page shows demo data)',
    },
    issues: {
      skippedTitle: '{n} note was not read: | {n} notes were not read:',
      warningsTitle: '{n} thing to check (the card is shown): | {n} things to check (the cards are shown):',
    },
  },

  settings: {
    sections: {
      basic: 'Basic settings',
      alert: 'Announcement',
      page: 'Page settings',
      icp: 'ICP filing',
      background: 'Custom background',
    },
    fields: {
      sitename: {
        name: 'Site title',
        help: 'Shown in the top-left corner of the page and in the browser tab',
      },
      defaultLanguage: {
        name: 'Default language',
        help: 'Interface language for first-time visitors; "Follow browser" picks Chinese or English based on the browser language. Visitors can switch in the top right and their browser will remember',
        options: {
          'auto': 'Follow browser',
          'zh-CN': '简体中文',
          'en': 'English',
        },
      },
      defaultCardStyle: {
        name: 'Default card style',
        help: 'Card style shown to first-time visitors; visitors can switch in the top right of the home page and their browser will remember',
        options: {
          namecard: 'Card',
          dial: 'Dial',
          bar: 'Bar',
        },
      },
      defaultSort: {
        name: 'Default sort order',
        help: 'Default order of the card wall',
        options: {
          renewal: 'By next renewal date',
          manual: 'By note file name',
          name: 'By name',
          country: 'By country / region',
        },
      },
      alertEnabled: {
        name: 'Enable announcement',
        help: 'Show a custom announcement banner on the home page',
      },
      alertTitle: {
        name: 'Announcement title',
        help: 'Title of the announcement',
      },
      alertContent: {
        name: 'Announcement content',
        help: 'Body text of the announcement (supports basic Markdown)',
      },
      earthViewMode: {
        name: 'Header display mode',
        options: {
          'earth': 'Rotating globe',
          'earth-stop': 'Static globe',
          'maps': 'Dot map',
          'cards': 'Summary cards only',
          'hide': 'Hide entire header',
        },
      },
      headerLinks: {
        name: 'Header links',
        help: 'Links to other sites in the top-right of the header. Format: label=URL, separated by semicolons, e.g. Servers=https://monitor.example.com',
      },
      visitorInfoCardEnabled: {
        name: 'Visitor info card',
        help: 'Show a card with visitor location, device, and browser details',
      },
      hideAdminEntryWhenLoggedOut: {
        name: 'Hide Admin link',
        help: 'Hide the top Admin link when not signed in',
      },
      disablePageAnimation: {
        name: 'Reduce motion',
        help: 'Reduce page transition animations for faster responsiveness',
      },
      cancelledLast: {
        name: 'Put cancelled numbers last',
        help: 'Move cancelled numbers to the end of the list',
      },
      icpEnabled: {
        name: 'Show ICP filing',
        help: 'Display China ICP filing number in the footer',
      },
      icpNumber: {
        name: 'ICP filing number',
        help: 'Website ICP filing number (e.g. 京ICP备12345678号)',
      },
      icpUrl: {
        name: 'ICP filing link',
        help: 'Target URL when clicking the ICP filing number',
      },
      policeEnabled: {
        name: 'Show public security filing',
        help: 'Display public security filing info in the footer',
      },
      policeNumber: {
        name: 'Public security filing number',
        help: 'Public security filing number (e.g. 京公网安备 11010502000000号)',
      },
      policeUrl: {
        name: 'Public security filing link',
        help: 'Target URL when clicking the public security filing number; leave blank for no link',
      },
      backgroundEnabled: {
        name: 'Enable custom background',
        help: 'Use a custom image or video as the page background',
      },
      backgroundType: {
        name: 'Background type',
        options: {
          image: 'Image',
          video: 'Video',
        },
      },
      lightBackgroundUrl: {
        name: 'Light theme background URL',
        help: 'Background image or video URL for light theme',
      },
      darkBackgroundUrl: {
        name: 'Dark theme background URL',
        help: 'Background image or video URL for dark theme',
      },
      backgroundBlur: {
        name: 'Background blur radius',
        help: 'Gaussian blur radius in px; 0 disables blur',
      },
      backgroundOverlay: {
        name: 'Background overlay intensity',
        help: 'Negative values fade the background, 0 disables the overlay, positive values darken it; larger absolute values have a stronger effect',
      },
    },
  },

  // API and sync errors, keyed by the codes in worker/*.ts (AppError / NoteError)
  errors: {
    http: {
      network: 'Could not reach the server, check your network',
      requestFailed: 'Request failed ({status})',
      unsupportedMediaType: 'Unsupported request format',
      payloadTooLarge: 'Request is too large',
      badJson: 'Request body is not valid JSON',
      csrf: 'Request origin check failed',
      notFound: 'No such API endpoint',
      methodNotAllowed: 'Method not allowed',
      internal: 'Internal server error',
    },
    auth: {
      loginRequired: 'Sign in through Cloudflare Access first',
    },
    note: {
      noFrontmatter: 'The note has no properties block at the top (--- ... ---)',
      badFrontmatter: 'The properties block is malformed: {message}',
      noCarrier: 'Missing the "{property}" property',
      ignoredProperty: 'Property "{name}" has a value that cannot be read and was ignored',
      vanished: 'The note disappeared while syncing',
      check: '{problem}',
    },
    sync: {
      failed: 'Sync failed: {message}',
    },
  },
}

export default en
