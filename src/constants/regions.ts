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
