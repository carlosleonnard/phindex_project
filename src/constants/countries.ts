/**
 * PAÍSES E SEUS CONTINENTES (countries.ts)
 *
 * A lista fechada que o formulário de perfil oferece, com o continente de cada
 * país declarado explicitamente.
 *
 * Antes o continente era adivinhado por trechos de texto ("...gand..." dentro
 * de "Uganda" casava com uma pista asiática, e "United Kingdom" não casava com
 * nada). Como o campo `country` vem de um seletor fechado, não há motivo para
 * adivinhar: cada país tem uma linha, e o que não está aqui simplesmente não
 * pode ser escolhido.
 *
 * "Middle East" não é um continente geográfico, mas é como a navegação do
 * Phindex recorta o mundo, então os países do Oriente Médio e do Cáucaso
 * aparecem lá em vez de na Ásia.
 */

import type { Continent } from "./regions";

export const COUNTRY_CONTINENT: Record<string, Continent> = {
  // ÁFRICA
  "Algeria": "Africa",
  "Angola": "Africa",
  "Benin": "Africa",
  "Botswana": "Africa",
  "Burkina Faso": "Africa",
  "Burundi": "Africa",
  "Cabo Verde": "Africa",
  "Cameroon": "Africa",
  "Central African Republic": "Africa",
  "Chad": "Africa",
  "Comoros": "Africa",
  "Congo": "Africa",
  "Democratic Republic of the Congo": "Africa",
  "Djibouti": "Africa",
  "Egypt": "Africa",
  "Equatorial Guinea": "Africa",
  "Eritrea": "Africa",
  "Eswatini": "Africa",
  "Ethiopia": "Africa",
  "Gabon": "Africa",
  "Gambia": "Africa",
  "Ghana": "Africa",
  "Guinea": "Africa",
  "Guinea-Bissau": "Africa",
  "Ivory Coast": "Africa",
  "Kenya": "Africa",
  "Lesotho": "Africa",
  "Liberia": "Africa",
  "Libya": "Africa",
  "Madagascar": "Africa",
  "Malawi": "Africa",
  "Mali": "Africa",
  "Mauritania": "Africa",
  "Mauritius": "Africa",
  "Morocco": "Africa",
  "Mozambique": "Africa",
  "Namibia": "Africa",
  "Niger": "Africa",
  "Nigeria": "Africa",
  "Rwanda": "Africa",
  "São Tomé and Príncipe": "Africa",
  "Senegal": "Africa",
  "Seychelles": "Africa",
  "Sierra Leone": "Africa",
  "Somalia": "Africa",
  "South Africa": "Africa",
  "South Sudan": "Africa",
  "Sudan": "Africa",
  "Tanzania": "Africa",
  "Togo": "Africa",
  "Tunisia": "Africa",
  "Uganda": "Africa",
  "Zambia": "Africa",
  "Zimbabwe": "Africa",

  // AMÉRICAS
  "Antigua and Barbuda": "Americas",
  "Argentina": "Americas",
  "Bahamas": "Americas",
  "Barbados": "Americas",
  "Belize": "Americas",
  "Bolivia": "Americas",
  "Brazil": "Americas",
  "Canada": "Americas",
  "Chile": "Americas",
  "Colombia": "Americas",
  "Costa Rica": "Americas",
  "Cuba": "Americas",
  "Dominica": "Americas",
  "Dominican Republic": "Americas",
  "Ecuador": "Americas",
  "El Salvador": "Americas",
  "Grenada": "Americas",
  "Guatemala": "Americas",
  "Guyana": "Americas",
  "Haiti": "Americas",
  "Honduras": "Americas",
  "Jamaica": "Americas",
  "Mexico": "Americas",
  "Nicaragua": "Americas",
  "Panama": "Americas",
  "Paraguay": "Americas",
  "Peru": "Americas",
  "Puerto Rico": "Americas",
  "Saint Kitts and Nevis": "Americas",
  "Saint Lucia": "Americas",
  "Saint Vincent and the Grenadines": "Americas",
  "Suriname": "Americas",
  "Trinidad and Tobago": "Americas",
  "United States": "Americas",
  "Uruguay": "Americas",
  "Venezuela": "Americas",

  // ÁSIA
  "Afghanistan": "Asia",
  "Bangladesh": "Asia",
  "Bhutan": "Asia",
  "Brunei": "Asia",
  "Cambodia": "Asia",
  "China": "Asia",
  "India": "Asia",
  "Indonesia": "Asia",
  "Japan": "Asia",
  "Kazakhstan": "Asia",
  "Kyrgyzstan": "Asia",
  "Laos": "Asia",
  "Malaysia": "Asia",
  "Maldives": "Asia",
  "Mongolia": "Asia",
  "Myanmar": "Asia",
  "Nepal": "Asia",
  "North Korea": "Asia",
  "Pakistan": "Asia",
  "Philippines": "Asia",
  "Singapore": "Asia",
  "South Korea": "Asia",
  "Sri Lanka": "Asia",
  "Taiwan*": "Asia",
  "Taiwan": "Asia",
  "Tajikistan": "Asia",
  "Thailand": "Asia",
  "Timor-Leste": "Asia",
  "Turkmenistan": "Asia",
  "Uzbekistan": "Asia",
  "Vietnam": "Asia",

  // EUROPA
  "Albania": "Europe",
  "Andorra": "Europe",
  "Austria": "Europe",
  "Belarus": "Europe",
  "Belgium": "Europe",
  "Bosnia and Herzegovina": "Europe",
  "Bulgaria": "Europe",
  "Croatia": "Europe",
  "Czech Republic": "Europe",
  "Denmark": "Europe",
  "Estonia": "Europe",
  "Finland": "Europe",
  "France": "Europe",
  "Germany": "Europe",
  "Greece": "Europe",
  "Hungary": "Europe",
  "Iceland": "Europe",
  "Ireland": "Europe",
  "Italy": "Europe",
  "Latvia": "Europe",
  "Liechtenstein": "Europe",
  "Lithuania": "Europe",
  "Luxembourg": "Europe",
  "Malta": "Europe",
  "Moldova": "Europe",
  "Monaco": "Europe",
  "Montenegro": "Europe",
  "Netherlands": "Europe",
  "North Macedonia": "Europe",
  "Norway": "Europe",
  "Poland": "Europe",
  "Portugal": "Europe",
  "Romania": "Europe",
  "Russia": "Europe",
  "San Marino": "Europe",
  "Serbia": "Europe",
  "Slovakia": "Europe",
  "Slovenia": "Europe",
  "Spain": "Europe",
  "Sweden": "Europe",
  "Switzerland": "Europe",
  "Ukraine": "Europe",
  "United Kingdom": "Europe",
  "Vatican City": "Europe",

  // ORIENTE MÉDIO
  // Recorte da navegação do Phindex, não um continente: inclui o Cáucaso e a
  // Turquia, que a geografia costuma dividir entre Europa e Ásia.
  "Armenia": "Middle East",
  "Azerbaijan": "Middle East",
  "Bahrain": "Middle East",
  "Cyprus": "Middle East",
  "Georgia": "Middle East",
  "Iran": "Middle East",
  "Iraq": "Middle East",
  "Israel": "Middle East",
  "Jordan": "Middle East",
  "Kuwait": "Middle East",
  "Lebanon": "Middle East",
  "Oman": "Middle East",
  "Palestine": "Middle East",
  "Qatar": "Middle East",
  "Saudi Arabia": "Middle East",
  "Syria": "Middle East",
  "Turkey": "Middle East",
  "United Arab Emirates": "Middle East",
  "Yemen": "Middle East",

  // OCEANIA
  "Australia": "Oceania",
  "Fiji": "Oceania",
  "Kiribati": "Oceania",
  "Marshall Islands": "Oceania",
  "Micronesia": "Oceania",
  "Nauru": "Oceania",
  "New Zealand": "Oceania",
  "Palau": "Oceania",
  "Papua New Guinea": "Oceania",
  "Samoa": "Oceania",
  "Solomon Islands": "Oceania",
  "Tonga": "Oceania",
  "Tuvalu": "Oceania",
  "Vanuatu": "Oceania",
};

/**
 * Continente de um país.
 *
 * A comparação ignora caixa e espaços em volta porque o valor gravado no banco
 * é texto: perfis antigos podem ter grafias que o seletor atual não produz.
 */
export const continentOfCountry = (
  country: string | null | undefined
): Continent | null => {
  if (!country) return null;

  const direct = COUNTRY_CONTINENT[country.trim()];
  if (direct) return direct;

  const needle = country.trim().toLowerCase();
  for (const [name, continent] of Object.entries(COUNTRY_CONTINENT)) {
    if (name.toLowerCase() === needle) return continent;
  }

  return null;
};
