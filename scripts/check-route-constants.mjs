/**
 * Verifica que as listas de rotas do sitemap (api/_lib/routes.ts) continuam
 * cobrindo tudo que a navegação expõe (src/constants).
 *
 * O sitemap não pode importar src/constants/categories.ts porque aquele módulo
 * puxa ícones do lucide-react para dentro da serverless function. Esta checagem
 * substitui esse acoplamento: se as listas divergirem, o build falha em vez de
 * a categoria sumir do sitemap sem ninguém perceber.
 */

import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf-8');

/** Extrai os valores string de um array/objeto TS nomeado. */
function extractStrings(source, declName) {
  const start = source.indexOf(declName);
  if (start === -1) throw new Error(`could not find ${declName}`);
  const open = source.indexOf(source.includes(`${declName}: Record`) ? '{' : '[', start);
  const closer = source[open] === '{' ? '}' : ']';
  let depth = 0, end = -1;
  for (let i = open; i < source.length; i++) {
    if (source[i] === source[open]) depth++;
    else if (source[i] === closer && --depth === 0) { end = i; break; }
  }
  const body = source.slice(open + 1, end);
  return [...body.matchAll(/["']([^"']+)["']/g)].map((m) => m[1]);
}

const categoriesSrc = read('src/constants/categories.ts');
const regionsSrc = read('src/constants/regions.ts');
const routesSrc = read('api/_lib/routes.ts');

// CATEGORY_SLUG_MAP é "Display Name": "slug" — os slugs são os índices ímpares.
const catPairs = extractStrings(categoriesSrc, 'CATEGORY_SLUG_MAP');
const expectedCategories = catPairs.filter((_, i) => i % 2 === 1);

const expectedRegions = extractStrings(regionsSrc, 'CONTINENTS').map((c) =>
  c.toLowerCase().replace(/\s+/g, '-')
);

const actualCategories = extractStrings(routesSrc, 'CATEGORY_SLUGS');
const actualRegions = extractStrings(routesSrc, 'REGION_SLUGS');

const problems = [];
const compare = (label, expected, actual) => {
  const missing = expected.filter((v) => !actual.includes(v));
  const extra = actual.filter((v) => !expected.includes(v));
  if (missing.length) problems.push(`${label}: missing from api/_lib/routes.ts -> ${missing.join(', ')}`);
  if (extra.length) problems.push(`${label}: in api/_lib/routes.ts but not in src/constants -> ${extra.join(', ')}`);
};

compare('categories', expectedCategories, actualCategories);
compare('regions', expectedRegions, actualRegions);

// Os nomes de exibição (títulos das páginas pré-renderizadas) também precisam bater.
const pairsToMap = (pairs, keyFirst) => {
  const map = {};
  for (let i = 0; i < pairs.length; i += 2) {
    const [a, b] = [pairs[i], pairs[i + 1]];
    if (keyFirst) map[a] = b;
    else map[b] = a;
  }
  return map;
};
const expectedCategoryNames = pairsToMap(catPairs, false);
const actualCategoryNames = pairsToMap(extractStrings(routesSrc, 'CATEGORY_NAMES'), true);
const expectedRegionNames = Object.fromEntries(
  extractStrings(regionsSrc, 'CONTINENTS').map((c) => [c.toLowerCase().replace(/\s+/g, '-'), c])
);
const actualRegionNames = pairsToMap(extractStrings(routesSrc, 'REGION_NAMES'), true);
const compareNames = (label, expected, actual) => {
  for (const [slug, name] of Object.entries(expected)) {
    if (actual[slug] !== name) problems.push(`${label}: "${slug}" should be named "${name}" in api/_lib/routes.ts (found "${actual[slug] ?? 'nothing'}")`);
  }
  for (const slug of Object.keys(actual)) {
    if (!(slug in expected)) problems.push(`${label}: "${slug}" is in api/_lib/routes.ts but not in src/constants`);
  }
};
compareNames('category names', expectedCategoryNames, actualCategoryNames);
compareNames('region names', expectedRegionNames, actualRegionNames);

if (problems.length) {
  console.error('Route constants are out of sync:\n' + problems.map((p) => `  - ${p}`).join('\n'));
  process.exit(1);
}

console.log(
  `Route constants in sync (${actualCategories.length} categories, ${actualRegions.length} regions).`
);
