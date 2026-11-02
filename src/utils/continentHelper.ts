import { getRegionCode } from '@/utils/regionHelper'

/**
 * 首页分组：按号码所在大洲。
 * 跨洲的国家按常见习惯归：土耳其、高加索三国、哈萨克斯坦归亚洲，俄罗斯、塞浦路斯归欧洲；
 * 海外领地跟着地理位置走（比如加那利群岛归非洲，圣诞岛归大洋洲）。
 */

export const CONTINENTS = ['亚洲', '欧洲', '北美洲', '南美洲', '非洲', '大洋洲', '南极洲', '其他'] as const
export type Continent = typeof CONTINENTS[number]

const CODES_BY_CONTINENT: Record<Exclude<Continent, '其他'>, string> = {
  亚洲: 'AE AF AM AZ BD BH BN BT CN DG GE HK ID IL IN IO IQ IR JO JP KG KH KP KR KW KZ LA LB LK MM MN MO MV MY NP OM PH PK PS QA SA SG SY TH TJ TL TM TR TW UZ VN YE',
  欧洲: 'AD AL AT AX BA BE BG BY CH CY CZ DE DK EE ES EU FI FO FR GB GG GI GR HR HU IE IM IS IT JE LI LT LU LV MC MD ME MK MT NL NO PL PT RO RS RU SE SI SJ SK SM UA VA XK',
  北美洲: 'AG AI AW BB BL BM BQ BS BZ CA CP CR CU CW DM DO GD GL GP GT HN HT JM KN KY LC MF MQ MS MX NI PA PM PR SV SX TC TT US VC VG VI',
  南美洲: 'AR BO BR CL CO EC FK GF GS GY PE PY SR UY VE',
  非洲: 'AC AO BF BI BJ BW CD CF CG CI CM CV DJ DZ EA EG EH ER ET GA GH GM GN GQ GW IC KE KM LR LS LY MA MG ML MR MU MW MZ NA NE NG RE RW SC SD SH SL SN SO SS ST SZ TA TD TG TN TZ UG YT ZA ZM ZW',
  大洋洲: 'AS AU CC CK CX FJ FM GU KI MH MP NC NF NR NU NZ PF PG PN PW SB TK TO TV UM VU WF WS',
  南极洲: 'AQ BV HM TF',
}

const CONTINENT_BY_CODE = new Map<string, Continent>(
  Object.entries(CODES_BY_CONTINENT).flatMap(([continent, codes]) =>
    codes.split(' ').map(code => [code, continent as Continent] as const)),
)

/** 国旗 emoji → 大洲；认不出的地区归「其他」 */
export function getContinent(regionEmoji: string): Continent {
  if (!regionEmoji)
    return '其他'
  return CONTINENT_BY_CODE.get(getRegionCode(regionEmoji).toUpperCase()) ?? '其他'
}
