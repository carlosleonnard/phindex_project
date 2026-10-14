/**
 * META TAGS DE CATEGORIA E REGIÃO (listing-meta.ts)
 *
 * /category/:slug e /region/:slug também chegam aos crawlers de redes sociais
 * sem JavaScript: sem esta pré-renderização, um link de região compartilhado
 * mostrava o card genérico da home. Títulos e descrições repetem os de
 * CategoryPage e RegionPage, para o Google não ver duas versões da página.
 *
 * Um slug desconhecido recebe o index.html sem alteração, e o app mostra a
 * página 404 — o mesmo comportamento de antes desta rota existir.
 */

import { SITE_URL, DEFAULT_OG_IMAGE, DEFAULT_OG_IMAGE_ALT, injectMeta, readIndexHtml } from './prerender.js';
import { CATEGORY_NAMES, REGION_NAMES } from './routes.js';

const breadcrumb = (items: Array<{ name: string; item: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((crumb, index) => ({ '@type': 'ListItem', position: index + 1, ...crumb })),
});

export function renderCategoryHtml(slug: string): string | null {
  const name = CATEGORY_NAMES[slug];
  if (!name) return null;
  const url = `${SITE_URL}/category/${slug}`;
  const title = `${name} Phenotypes | Phindex`;
  const description = `Browse ${name} phenotype profiles on Phindex. See physical trait classifications and vote on characteristics.`;

  return injectMeta(readIndexHtml(), {
    title,
    description,
    canonical: url,
    image: DEFAULT_OG_IMAGE,
    imageAlt: DEFAULT_OG_IMAGE_ALT,
    imageWidth: '1200',
    imageHeight: '630',
    ogType: 'website',
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    jsonLd: [
      { '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, url, description },
      breadcrumb([
        { name: 'Home', item: SITE_URL },
        { name, item: url },
      ]),
    ],
  });
}

export function renderRegionHtml(slug: string): string | null {
  const name = REGION_NAMES[slug];
  if (!name) return null;
  const url = `${SITE_URL}/region/${slug}`;
  const title = `${name} Phenotypes | Phindex`;
  const description = `Explore ${name} phenotypes and physical traits. Discover phenotype classifications from ${name}. Vote and compare physical characteristics.`;

  return injectMeta(readIndexHtml(), {
    title,
    description,
    canonical: url,
    // Card 1200x630 de cada região, o mesmo que RegionPage declara.
    image: `${SITE_URL}/og/region-${slug}.png`,
    imageAlt: `A globe with ${name} highlighted`,
    imageWidth: '1200',
    imageHeight: '630',
    ogType: 'website',
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    jsonLd: [
      { '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, url, description },
      breadcrumb([
        { name: 'Home', item: SITE_URL },
        { name, item: url },
      ]),
    ],
  });
}

/** Serve o HTML da listagem; qualquer falha cai no index.html sem alteração. */
export function handleListingRequest(res: any, render: () => string | null) {
  try {
    const html = render() ?? readIndexHtml();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
    return res.status(200).send(html);
  } catch (error) {
    console.error('Listing prerender error:', error);
    try {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(readIndexHtml());
    } catch {
      return res.status(500).send('Internal Server Error');
    }
  }
}
