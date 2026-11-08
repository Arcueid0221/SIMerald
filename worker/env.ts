/** Bindings and variables configured in wrangler.jsonc (secrets/dev overrides in .dev.vars) */
export interface Env {
  /** Built frontend (dist/), served by Workers Static Assets */
  ASSETS: Fetcher
  /** R2 bucket the Obsidian vault is synced to by Remotely Save */
  NOTES: R2Bucket
  /** Synced snapshot, sync status and theme settings */
  STORE: KVNamespace
  /** Folder in the bucket that holds one note per card, e.g. `卡片` */
  CARDS_FOLDER: string
  /** Folder in the bucket that holds carrier logos, e.g. `logos` */
  LOGOS_FOLDER: string
  /** Timezone used for "today" when computing status, e.g. `Asia/Shanghai` */
  TIMEZONE: string
  /** Cloudflare Access team domain, e.g. `https://example.cloudflareaccess.com` */
  ACCESS_TEAM_DOMAIN: string
  /** Audience (AUD) tag of the Access application protecting /admin and /api/admin */
  ACCESS_AUD: string
  /** Local development only (.dev.vars): treat requests to localhost as signed in with this email */
  DEV_ADMIN_EMAIL?: string
  /** Set at deploy time by `npm run deploy` */
  GIT_HASH?: string
}
