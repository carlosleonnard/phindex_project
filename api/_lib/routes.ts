/**
 * ROTAS ESTÁTICAS PARA O SITEMAP (routes.ts)
 *
 * Espelha as listas de src/constants. Não importamos direto de
 * src/constants/categories.ts porque aquele módulo importa ícones do
 * lucide-react, arrastando um pacote de UI para dentro da serverless function.
 *
 * A consistência é verificada por scripts/check-route-constants.mjs, que roda
 * no build — se uma categoria for adicionada em src/constants e esquecida aqui,
 * o build falha em vez de a página sumir silenciosamente do sitemap.
 */

export const CATEGORY_SLUGS = [
  'community',
  'pop-culture',
  'music-and-entertainment',
  'arts',
  'philosophy',
  'sciences',
  'sports',
  'business',
  'politics',
  'criminals',
  'religion',
  'military',
] as const;

/** Nome de exibição de cada categoria, para títulos das páginas pré-renderizadas. */
export const CATEGORY_NAMES: Record<string, string> = {
  'community': 'Community',
  'pop-culture': 'Pop Culture',
  'music-and-entertainment': 'Music and Entertainment',
  'arts': 'Arts',
  'philosophy': 'Philosophy',
  'sciences': 'Sciences',
  'sports': 'Sports',
  'business': 'Business',
  'politics': 'Politics',
  'criminals': 'Criminals',
  'religion': 'Religion',
  'military': 'Military',
};

export const REGION_SLUGS = [
  'africa',
  'asia',
  'europe',
  'americas',
  'middle-east',
  'oceania',
] as const;

/** Nome de exibição de cada região (o continente). */
export const REGION_NAMES: Record<string, string> = {
  'africa': 'Africa',
  'asia': 'Asia',
  'europe': 'Europe',
  'americas': 'Americas',
  'middle-east': 'Middle East',
  'oceania': 'Oceania',
};
