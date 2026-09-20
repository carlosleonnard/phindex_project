/**
 * REGIÕES GEOGRÁFICAS (regions.ts)
 *
 * Os votos de "Primary Geographic" são gravados como sub-regiões
 * ("North Africa", "Southern Europe", "Levant"…), mas a navegação da interface
 * usa os seis continentes. Este mapa faz a ponte entre os dois.
 *
 * Sem ele, filtrar por "Africa" nunca casaria com um perfil classificado como
 * "North Africa".
 */

import { continentOfCountry } from "./countries";

export const CONTINENTS = [
  "Africa",
  "Asia",
  "Europe",
  "Americas",
  "Middle East",
  "Oceania",
] as const;

export type Continent = (typeof CONTINENTS)[number];

/** Sub-região votada -> continente exibido na interface. */
export const SUBREGION_TO_CONTINENT: Record<string, Continent> = {
  // Africa
  "North Africa": "Africa",
  "East Africa": "Africa",
  "West Africa": "Africa",
  "Central Africa": "Africa",
  "Southern Africa": "Africa",
  "Sub-Saharan Africa": "Africa",
  "Horn of Africa": "Africa",

  // Asia
  "Eastern Asia": "Asia",
  "Southern Asia": "Asia",
  "Southeastern Asia": "Asia",
  "Central Asia": "Asia",
  "Northern Asia": "Asia",
  "Siberia": "Asia",

  // Europe
  "Northern Europe": "Europe",
  "Southern Europe": "Europe",
  "Eastern Europe": "Europe",
  "Western Europe": "Europe",
  "Central Europe": "Europe",

  // Americas
  "Northern America": "Americas",
  "Central America": "Americas",
  "Southern America": "Americas",
  "Caribbean": "Americas",

  // Middle East
  "Levant": "Middle East",
  "Arabian Peninsula": "Middle East",
  "Persian Plateau": "Middle East",
  "Anatolia": "Middle East",
  "Mesopotamia": "Middle East",
  "Caucasus": "Middle East",

  // Oceania
  "Polynesia": "Oceania",
  "Melanesia": "Oceania",
  "Micronesia": "Oceania",
  "Australia": "Oceania",
};

/**
 * Resolve o continente de uma classificação geográfica.
 *
 * Aceita tanto a sub-região ("Levant") quanto o próprio continente ("Asia"),
 * já que perfis antigos podem ter sido votados no nível mais amplo.
 */
export const continentOf = (classification: string | null | undefined): Continent | null => {
  if (!classification) return null;

  const direct = SUBREGION_TO_CONTINENT[classification];
  if (direct) return direct;

  const asContinent = CONTINENTS.find(
    (continent) => continent.toLowerCase() === classification.toLowerCase()
  );
  return asContinent ?? null;
};

/**
 * PRESENÇA VISUAL DAS REGIÕES
 *
 * Cada continente carrega um matiz próprio. São os únicos pontos de cor
 * não-teal da navegação: servem para localizar a região na lista sem ler o
 * rótulo, e para amarrar a pill do feed à linha da sidebar.
 */
export const CONTINENT_META: Record<Continent, { slug: string; short: string; dot: string }> = {
  "Africa": { slug: "africa", short: "Africa", dot: "35 85% 55%" },
  "Americas": { slug: "americas", short: "Americas", dot: "150 45% 45%" },
  "Asia": { slug: "asia", short: "Asia", dot: "5 70% 58%" },
  "Europe": { slug: "europe", short: "Europe", dot: "190 55% 40%" },
  "Middle East": { slug: "middle-east", short: "M.E.", dot: "265 40% 58%" },
  "Oceania": { slug: "oceania", short: "Oceania", dot: "210 65% 55%" },
};

/** Ordem de exibição na sidebar e nas pills do feed. */
export const CONTINENT_ORDER: Continent[] = [
  "Africa",
  "Americas",
  "Asia",
  "Europe",
  "Middle East",
  "Oceania",
];

/**
 * Palavras que denunciam o continente quando o perfil ainda não tem voto
 * geográfico. É um palpite a partir de país/ancestralidade — texto livre
 * preenchido à mão — e por isso só entra como fallback de `continentOf`.
 */
const ORIGIN_HINTS: Record<Continent, string[]> = {
  "Africa": [
    "africa", "african", "nigeria", "nigéria", "egypt", "egito", "morocco",
    "marrocos", "kenya", "quênia", "ghana", "gana", "ethiop", "etióp",
    "bantu", "nilotic", "sub-saharan", "angola", "senegal", "somal",
  ],
  "Asia": [
    "asia", "asian", "china", "chinese", "chinês", "japan", "japão", "japanese",
    "korea", "coreia", "korean", "india", "índia", "indian", "thai", "tailândia",
    "vietnam", "vietnã", "philipp", "filipinas", "indones", "malay", "malás",
    "pakistan", "paquistão", "bangladesh", "nepal", "mongol", "tibet", "sino",
    "kazakh", "cazaque", "uzbek", "usbeque", "kyrgyz", "tajik", "turkmen",
    "siberia", "sibéria", "burma", "myanmar", "cambod", "camboja", "laos",
    "sri lanka", "singapore", "singapura", "taiwan", "hmong",
  ],
  "Europe": [
    "europe", "european", "portugal", "portuguese", "português", "spain",
    "espanha", "spanish", "france", "frança", "french", "german", "alemanha",
    "italy", "itália", "italian", "england", "english", "britain", "reino unido",
    "scot", "irish", "irlanda", "greece", "grécia", "greek", "nordic", "nórdic",
    "slav", "eslav", "poland", "polônia", "polish", "russia", "rússia", "ukrain",
    "ucrân", "mediterran", "mediterrân", "alpine", "alpin", "balkan", "bálcã",
    "sweden", "suécia", "swedish", "norway", "noruega", "denmark", "dinamarca",
    "netherlands", "holanda", "dutch", "belgium", "bélgica", "switzerland",
    "suíça", "swiss", "austria", "áustria", "austrian", "romania", "romênia",
    "romanian", "hungary", "hungria", "hungarian", "czech", "tcheca", "slovak",
    "eslováqu", "bulgaria", "bulgária", "serbia", "sérvia", "croatia", "croácia",
    "bosnia", "bósnia", "slovenia", "eslovênia", "albania", "albânia", "finland",
    "finlândia", "finnish", "iceland", "islândia", "estonia", "estônia", "latvia",
    "letônia", "lithuania", "lituânia", "belarus", "bielorrússia", "moldova",
    "ashkenazi", "sephardic", "sefardita",
  ],
  "Americas": [
    "america", "américa", "brazil", "brasil", "brazilian", "brasileir",
    "united states", "estados unidos", "canada", "canadá", "mexic", "méxic",
    "argentin", "chile", "peru", "colomb", "colômb", "venezuel", "bolív",
    "uruguai", "uruguay", "paraguai", "cuba", "jamaic", "haiti", "dominican",
    "amerindian", "indigenous", "indígena", "native american", "ecuador",
    "equador", "guatemal", "hondur", "nicarag", "salvador", "panama", "panamá",
    "costa rica", "puerto ric", "porto ric", "trinidad", "guyan", "surinam",
    "quechua", "aymara", "mapuche", "guarani", "guarani",
  ],
  "Middle East": [
    "middle east", "oriente médio", "arab", "árab", "saudi", "arábia",
    "emirat", "iran", "irã", "persian", "persa", "iraq", "iraque", "israel",
    "jordan", "jordân", "lebanon", "líbano", "levant", "syria", "síria",
    "kuwait", "qatar", "oman", "omã", "yemen", "iêmen", "turkey", "turquia",
    "turkish", "afghan", "afegan", "mesopotam", "armenia", "armênia",
    "armenian", "georgia", "geórgia", "azerbaij", "kurd", "curdo", "caucas",
    "cáucaso", "anatolia", "anatólia", "assyrian", "assíri",
  ],
  "Oceania": [
    "oceania", "australia", "austrália", "australian", "australóide",
    "new zealand", "nova zelândia", "maori", "fiji", "papua", "samoa",
    "tonga", "vanuatu", "melanes", "melanés", "polynes", "polinés", "micrones",
  ],
};

/** Melhor pista encontrada num texto: a mais longa vence. */
const bestHint = (haystack: string): { continent: Continent; length: number } | null => {
  let best: { continent: Continent; length: number } | null = null;

  for (const continent of CONTINENT_ORDER) {
    for (const hint of ORIGIN_HINTS[continent]) {
      if (haystack.includes(hint) && (!best || hint.length > best.length)) {
        best = { continent, length: hint.length };
      }
    }
  }

  return best;
};

/**
 * Continente de um perfil, para navegação e contagem.
 *
 * Três fontes, da mais confiável para a menos:
 *
 * 1. O voto geográfico da comunidade, quando existe — é a classificação que o
 *    site inteiro usa, e o Explore filtra pelo mesmo critério.
 * 2. O país, resolvido por uma TABELA EXPLÍCITA (constants/countries.ts). O
 *    campo vem de um seletor fechado, então cada valor possível tem uma linha.
 * 3. A ancestralidade, por palavras-chave, só quando as duas primeiras não
 *    responderam — é texto livre e costuma ser uma LISTA de origens, então
 *    serve de último recurso, nunca para contradizer o país.
 */
export const profileContinent = (profile: {
  most_voted_geographic?: string | null;
  country?: string | null;
  ancestry?: string | null;
}): Continent | null => {
  const voted = continentOf(profile.most_voted_geographic);
  if (voted) return voted;

  const byCountry = continentOfCountry(profile.country);
  if (byCountry) return byCountry;

  const ancestry = (profile.ancestry || "").toLowerCase().trim();
  if (ancestry) {
    const match = bestHint(ancestry);
    if (match) return match.continent;
  }

  return null;
};
