import type { CardKind, NotionColor } from '@shared/types'
import { i18n } from '@/i18n'

const KIND_ICONS: Record<CardKind, string> = {
  physical: 'tabler:device-sim',
  adapter: 'tabler:device-sd-card',
  embedded: 'tabler:device-mobile',
  virtual: 'tabler:cloud',
}

/** Maps Notion select-option colors to Tailwind text color classes */
const COLOR_CLASSES: Record<NotionColor, string> = {
  default: 'text-slate-500',
  gray: 'text-slate-500',
  brown: 'text-amber-700 dark:text-amber-500',
  orange: 'text-orange-500',
  yellow: 'text-yellow-500',
  green: 'text-emerald-600',
  blue: 'text-sky-500',
  purple: 'text-violet-500',
  pink: 'text-pink-500',
  red: 'text-rose-500',
}

export function getKindIcon(kind: CardKind): string {
  return KIND_ICONS[kind] ?? KIND_ICONS.physical
}

export function getKindName(kind: CardKind): string {
  return i18n.global.t(`cardKinds.${kind in KIND_ICONS ? kind : 'physical'}`)
}

export function getTypeColorClass(color: NotionColor): string {
  return COLOR_CLASSES[color] ?? COLOR_CLASSES.default
}
