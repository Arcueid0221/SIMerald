import { getRegionCode } from '@/utils/regionHelper'

/**
 * Continent grouping for the home view.
 * Transcontinental countries follow common convention (Turkey, South Caucasus, and
 * Kazakhstan under Asia; Russia and Cyprus under Europe); overseas territories are
 * grouped by geographic location (e.g. Canary Islands under Africa, Christmas Island under Oceania).
 */

/** Display order; names are translated via `continents.<code>` */
export const CONTINENTS = ['asia', 'europe', 'northAmerica', 'southAmerica', 'africa', 'oceania', 'antarctica', 'other'] as const
export type Continent = typeof CONTINENTS[number]

const CODES_BY_CONTINENT: Record<Exclude<Continent, 'other'>, string> = {
  asia: 'AE AF AM AZ BD BH BN BT CN DG GE HK ID IL IN IO IQ IR JO JP KG KH KP KR KW KZ LA LB LK MM MN MO MV MY NP OM PH PK PS QA SA SG SY TH TJ TL TM TR TW UZ VN YE',
  europe: 'AD AL AT AX BA BE BG BY CH CY CZ DE DK EE ES EU FI FO FR GB GG GI GR HR HU IE IM IS IT JE LI LT LU LV MC MD ME MK MT NL NO PL PT RO RS RU SE SI SJ SK SM UA VA XK',
  northAmerica: 'AG AI AW BB BL BM BQ BS BZ CA CP CR CU CW DM DO GD GL GP GT HN HT JM KN KY LC MF MQ MS MX NI PA PM PR SV SX TC TT US VC VG VI',
  southAmerica: 'AR BO BR CL CO EC FK GF GS GY PE PY SR UY VE',
  africa: 'AC AO BF BI BJ BW CD CF CG CI CM CV DJ DZ EA EG EH ER ET GA GH GM GN GQ GW IC KE KM LR LS LY MA MG ML MR MU MW MZ NA NE NG RE RW SC SD SH SL SN SO SS ST SZ TA TD TG TN TZ UG YT ZA ZM ZW',
  oceania: 'AS AU CC CK CX FJ FM GU KI MH MP NC NF NR NU NZ PF PG PN PW SB TK TO TV UM VU WF WS',
  antarctica: 'AQ BV HM TF',
}

const CONTINENT_BY_CODE = new Map<string, Continent>(
  Object.entries(CODES_BY_CONTINENT).flatMap(([continent, codes]) =>
    codes.split(' ').map(code => [code, continent as Continent] as const)),
)

/** Map a flag emoji to its continent, falling back to `'other'` if unrecognized */
export function getContinent(regionEmoji: string): Continent {
  if (!regionEmoji)
    return 'other'
  return CONTINENT_BY_CODE.get(getRegionCode(regionEmoji).toUpperCase()) ?? 'other'
}
