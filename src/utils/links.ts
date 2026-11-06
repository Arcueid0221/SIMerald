import { currentLocale } from '@/i18n'

/** External links shown in the UI */

export const REPO_URL = 'https://github.com/BurningSky0306/simerald'

/** Step-by-step Notion setup guide (template links, integration, auto-detection) in the current UI language */
export function notionSetupUrl(): string {
  return `${REPO_URL}/blob/main/docs/${currentLocale() === 'zh-CN' ? 'notion-setup.zh-CN.md' : 'notion-setup.md'}`
}
