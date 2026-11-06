/**
 * English UI strings; must provide every key of `zh-CN.ts` (enforced by `MessageSchema`).
 * `keepAlive`, `recordKinds` and `cycle` use the option names of the English Notion template.
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
    demoBody: 'The owner has not connected Notion yet. The numbers and carriers below are fictional. ',
    demoConnect: 'Connect Notion in Admin',
    demoGuide: 'View setup guide',
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
    loggedOut: 'Signed out',
    loading: 'Loading…',
    loadFailed: 'Failed to load, please refresh the page',
    statusLoadFailed: 'Failed to load admin status',
  },

  login: {
    title: 'Owner sign in',
    password: 'Password',
    totp: '2FA code',
    remember: 'Keep me signed in on this device for {days} days',
    submit: 'Sign in',
    failed: 'Sign-in failed',
  },

  setup: {
    failed: 'Setup failed',
    verifyFailed: 'Verification failed',
    passwordMismatch: 'Passwords do not match',
    step1: {
      title: 'Initial setup · Step 1: Set password',
      description: 'SIMerald does not have an owner account yet. To prevent unauthorized setup, enter the one-time setup key generated on the server: run docker logs simerald on the server, or check setup-key.txt in the data directory.',
      setupKey: 'Setup key',
      setupKeyHelp: 'Format like ABCD-EFGH-IJKL',
      password: 'Owner password',
      passwordHelp: 'At least {min} characters, preferably generated with a password manager',
      passwordConfirm: 'Confirm password',
      next: 'Next',
    },
    step2: {
      title: 'Initial setup · Step 2: Link two-factor authentication',
      description: 'When signing in, you will also need the 6-digit code from your authenticator app, which refreshes every 30 seconds.',
      code: 'The 6-digit code in the app',
      submit: 'Verify and finish',
    },
    step3: {
      title: 'Initial setup · Step 3: Save recovery codes',
      saved: 'I have saved my recovery codes',
      enter: 'Go to Admin',
    },
  },

  recovery: {
    notice: 'These recovery codes are shown only once. If you lose your phone or cannot open your authenticator app, you can use one of them instead of a 6-digit code to sign in. Each code can only be used once. Save them in a password manager or print them out.',
    copyAll: 'Copy all',
    download: 'Download as text file',
    copied: 'Recovery codes copied',
    fileHeader: 'SIMerald recovery codes (each can be used only once)',
  },

  totp: {
    scan: 'Scan the QR code on the left with an authenticator app on your phone (Google Authenticator, Microsoft Authenticator, 1Password, etc.).',
    manual: 'If you cannot scan it, choose "Enter a setup key" in the app and enter this key:',
    copySecret: 'Copy key',
    secretCopied: 'Key copied',
  },

  security: {
    title: 'Account security',
    recoveryLeft: 'Remaining recovery codes',
    recoveryCount: '{n} code | {n} codes',
    sessions: 'Signed-in devices',
    sessionCount: '{n} device | {n} devices',
    changePassword: 'Change password',
    rebind: 'Re-link two-factor authentication',
    regenerate: 'Regenerate recovery codes',
    logoutOthers: 'Sign out other devices',
    savedDone: 'I have saved them, done',
    newCode: 'The 6-digit code in the new app',
    verifyReplace: 'Verify and replace',
    hints: {
      password: 'Changing your password will sign out all other devices.',
      rebind: 'Use this when switching phones or reinstalling your authenticator app. Old verification codes and recovery codes will be invalidated.',
      recovery: 'All previous recovery codes will be invalidated.',
    },
    currentPassword: 'Current password',
    code: '2FA code',
    codeHelp: '6-digit code from your authenticator app, or a recovery code',
    newPassword: 'New password',
    newPasswordHelp: 'At least {min} characters',
    newPasswordConfirm: 'Confirm new password',
    submit: {
      password: 'Change password',
      rebind: 'Next',
      recovery: 'Generate new recovery codes',
    },
    failed: 'Action failed',
    passwordMismatch: 'New passwords do not match',
    passwordChanged: 'Password changed and other devices signed out',
    rebound: 'Two-factor authentication re-linked; codes from the old device no longer work',
    othersLoggedOut: 'Other devices signed out',
  },

  theme: {
    title: 'Theme settings',
    description: 'Visitors will see the changes after refreshing the page.',
    save: 'Save theme settings',
    saved: 'Theme settings saved',
  },

  sync: {
    title: 'Data sync',
    description: 'SIMerald pulls data from Notion once a day. Click "Sync now" to see Notion edits right away.',
    syncNow: 'Sync now',
    status: 'Status',
    cards: 'Cards',
    cardCount: '{n} card | {n} cards',
    records: 'Expense records',
    recordCount: '{n} record | {n} records',
    lastSuccess: 'Last success',
    nextRun: 'Next automatic sync',
    dailyTime: 'Daily sync time',
    timezone: 'Timezone',
    saveSchedule: 'Save schedule',
    scheduleSaved: 'Sync schedule saved',
    failed: 'Sync failed',
    failedWith: 'Sync failed: {error}',
    done: 'Sync complete: {cards}, {records}',
    errorAt: '{time}: {error}',
    state: {
      notConnected: 'Notion not connected (showing demo data)',
      running: 'Syncing…',
      failed: 'Last sync failed',
      ok: 'Synced',
      never: 'Never synced',
    },
    issues: {
      title: '{n} field does not match and its data will not be shown. Rename the column in Notion, or switch the field preset / custom mapping under "Notion connection": | {n} fields do not match and their data will not be shown. Rename the columns in Notion, or switch the field preset / custom mapping under "Notion connection":',
      missing: ': column not found',
      type: ': type is {actual}, expected {expected}',
      legend: '● Affects home page ○ Only affects owner-only info',
      db: {
        cards: 'SIM Cards',
        records: 'Expense Records',
      },
    },
  },

  notion: {
    title: 'Notion connection',
    description: 'SIMerald only reads from Notion and never modifies your content.',
    steps: {
      copy: '1. Duplicate the SIMerald Notion template to your workspace (see the {guide} for template links and step-by-step instructions).',
      guide: 'setup guide',
      integration: '2. Open notion.so/profile/integrations, create an "Internal" integration with only "Read content" enabled, and copy its token.',
      connect: '3. Open the template page in Notion, click ••• → "Connections" in the top right, and select the integration you just created.',
      detect: '4. Paste the token below, click "Auto-detect", verify the detected databases, and click "Save" to sync immediately.',
    },
    token: {
      help: 'The token is stored only on the server and will never be shown again',
      configured: 'Configured. Leave blank to keep the current token, or enter a new one to replace it',
      fromEnv: 'Token is set via a server environment variable and cannot be changed here',
      configuredPlaceholder: '•••••••• (configured)',
      clear: 'Remove saved token (reverts to demo data)',
    },
    detect: {
      button: 'Auto-detect',
      running: 'Detecting…',
      choose: 'Found {n} template. Choose which one to connect: | Found {n} templates. Choose which one to connect:',
      found: 'Detected {preset}: {databases}. Click "Save" to finish connecting',
      recordsMissing: 'Found the SIM Cards database but not its Expense Records database. Make sure that one is also connected to this integration under "Connections"',
      none: 'No SIMerald template found. Make sure you duplicated the template and connected this integration via ••• → "Connections" in the top right of the page',
      failed: 'Auto-detect failed',
      cardsFallback: 'SIM Cards',
      noRecords: '(Expense Records not found)',
      accountsFallback: 'Payment Accounts',
    },
    databases: {
      cards: 'SIM Cards database',
      records: 'Expense Records database',
      accounts: 'Payment Accounts database (optional)',
      help: 'Database link or ID',
      accountsHelp: 'Used to display payment account names',
      optional: 'Optional',
    },
    preset: 'Field preset',
    presetHelp: 'Choose the language matching the official template you duplicated, or "Custom mapping" if you renamed columns.',
    presets: {
      zh: 'Chinese template',
      en: 'English template',
      custom: 'Custom mapping (JSON)',
    },
    mapping: 'Field mapping JSON',
    mappingHelp: 'Layered on top of the Chinese template: keys are SIMerald fields, values are the column names in your Notion databases. Only include what differs from the Chinese template.',
    save: {
      running: 'Saving and syncing…',
      saved: 'Saved',
      synced: 'Saved and synced',
      syncFailed: 'Saved, but sync failed: {error}',
      fieldIssues: 'Saved and synced, but {n} field does not match. See "Data sync" for details | Saved and synced, but {n} fields do not match. See "Data sync" for details',
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
          notion: 'By Notion order',
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

  errors: {
    retryIn: '{message} (in about {minutes} min)',
    http: {
      network: 'Failed to connect to server, please check your network',
      requestFailed: 'Request failed ({status})',
      unsupportedMediaType: 'Unsupported request format',
      payloadTooLarge: 'Request payload too large',
      badJson: 'Request body is not valid JSON',
      badUrl: 'Invalid URL format',
      csrf: 'Request origin verification failed',
      notFound: 'Endpoint not found',
      methodNotAllowed: 'Request method not allowed',
      internal: 'Internal server error',
    },
    auth: {
      loginRequired: 'Please sign in first',
      passwordTooShort: 'Password must be at least {min} characters',
      passwordTooLong: 'Password is too long',
      tooManyAttempts: 'Too many attempts, please try again later',
      badCredentials: 'Incorrect password or 2FA code',
      setupInvalid: 'Setup session is invalid, please start over',
      setupExpired: 'Setup session timed out, please start over',
      alreadySetUp: 'Owner account has already been set up',
      badSetupKey: 'Incorrect setup key',
      badTotp: 'Incorrect 2FA code; check that your phone clock is accurate and try again',
      setupRequired: 'Please complete initial setup first',
    },
    notion: {
      tokenRequired: 'Please enter a Notion token first',
      badToken: 'Invalid Notion token format',
      unauthorized: 'Notion token is invalid or has been revoked',
      forbidden: 'Notion integration does not have "Read content" permission',
      notFound: 'Database not found: check the ID or make sure the page is shared with this integration under "Connections"',
      rateLimited: 'Too many requests to Notion, please try again later',
      apiError: 'Notion API error ({status} {code}): {message}',
      network: 'Cannot connect to Notion: {message}',
      noDataSource: 'No data source found in this database',
    },
    settings: {
      badSyncTime: 'Sync time must be in HH:mm format, e.g. 05:00',
      badTimezone: 'Invalid timezone, e.g. Asia/Shanghai',
      badDatabaseId: 'Invalid database ID format: {value}',
      badMapping: 'Field mapping is not valid JSON',
    },
    sync: {
      noToken: 'Notion token is not configured yet',
      noDatabases: 'SIM Cards and Expense Records database IDs are not set yet',
      accountsSkipped: 'Skipped the Payment Accounts database (account names will not be shown): {cause}',
      failed: 'Sync failed: {message}',
    },
  },
}

export default en
