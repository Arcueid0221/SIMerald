/** Site links in the top-right of the header, from the `headerLinks` theme setting */
export interface HeaderLink {
  label: string
  url: string
}

const ENTRY_SEPARATOR_REGEX = /[;\n；]+/
const MAX_LINKS = 5

/**
 * Parses `label=url; label=url` (separated by semicolons or new lines). Only http/https URLs are kept;
 * other entries are ignored. Example: `服务器=https://monitor.example.com`
 */
export function parseHeaderLinks(value: unknown): HeaderLink[] {
  if (typeof value !== 'string')
    return []
  const links: HeaderLink[] = []
  for (const entry of value.split(ENTRY_SEPARATOR_REGEX)) {
    const index = entry.indexOf('=')
    if (index <= 0)
      continue
    const label = entry.slice(0, index).trim()
    let url: URL
    try {
      url = new URL(entry.slice(index + 1).trim())
    }
    catch {
      continue
    }
    if (!label || (url.protocol !== 'https:' && url.protocol !== 'http:'))
      continue
    links.push({ label: label.slice(0, 20), url: url.href })
    if (links.length >= MAX_LINKS)
      break
  }
  return links
}
