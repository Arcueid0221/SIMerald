import type { CardKind, NotionColor } from '@shared/types'

const KIND_ICONS: Record<CardKind, string> = {
  physical: 'tabler:device-sim',
  adapter: 'tabler:device-sd-card',
  embedded: 'tabler:device-mobile',
  virtual: 'tabler:cloud',
}

const KIND_NAMES: Record<CardKind, string> = {
  physical: '实体 SIM',
  adapter: 'eSIM 卡托',
  embedded: '手机内置 eSIM',
  virtual: '虚拟号码',
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
  return KIND_NAMES[kind] ?? KIND_NAMES.physical
}

export function getTypeColorClass(color: NotionColor): string {
  return COLOR_CLASSES[color] ?? COLOR_CLASSES.default
}
