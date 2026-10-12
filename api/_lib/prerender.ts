/**
 * PRÉ-RENDERIZAÇÃO DE META TAGS (prerender.ts)
 *
 * Crawlers de redes sociais (Facebook, Twitter, WhatsApp, Discord, LinkedIn,
 * iMessage) não executam JavaScript, então as tags injetadas pelo react-helmet
 * são invisíveis para eles. Estas funções reescrevem o index.html construído
 * com as tags corretas antes de servir a página.
 *
 * As substituições são verificadas: se um seletor deixar de casar (porque o
 * index.html mudou de formato), a função lança em vez de servir silenciosamente
 * o card genérico da home.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

export const SITE_URL = 'https://www.phenotypeindex.com';
export const SITE_NAME = 'Phindex - Phenotype Index';
export const TWITTER_HANDLE = '@phenotypeindex';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;
/** Igual ao og:image:alt do index.html. */
export const DEFAULT_OG_IMAGE_ALT =
  'Phindex: discover your phenotype, classify your world. Six faces in the Phindex teal.';

export function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Lê o index.html construído, com fallback para o de desenvolvimento. */
export function readIndexHtml(): string {
  try {
    return readFileSync(join(process.cwd(), 'dist', 'index.html'), 'utf-8');
  } catch {
    return readFileSync(join(process.cwd(), 'index.html'), 'utf-8');
  }
}

/** Deriva o content-type de og:image pela extensão do arquivo. */
export function imageMimeType(url: string): string {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  return 'image/jpeg';
}

type MetaValues = {
  title: string;
  description: string;
  canonical: string;
  image: string;
  /** Texto alternativo da imagem (og:image:alt e twitter:image:alt). */
  imageAlt: string;
  imageWidth: string;
  imageHeight: string;
  ogType: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  /** JSON-LD adicional injetado antes de </head>. */
  jsonLd?: unknown[];
};

/**
 * Substitui uma tag existente, lançando se o padrão não casar.
 *
 * O objetivo é falhar alto: uma substituição silenciosamente ignorada entrega
 * ao crawler o card errado sem nenhum sinal de erro.
 */
function replaceOrThrow(html: string, pattern: RegExp, replacement: string, label: string): string {
  if (!pattern.test(html)) {
    throw new Error(`prerender: no match for "${label}" in index.html`);
  }
  return html.replace(pattern, replacement);
}

/** Reescreve todas as meta tags do index.html com os valores fornecidos. */
export function injectMeta(html: string, v: MetaValues): string {
  const title = escapeHtml(v.title);
  const description = escapeHtml(v.description);
  const image = escapeHtml(v.image);
  const canonical = escapeHtml(v.canonical);

  let out = html;

  out = replaceOrThrow(out, /<title>[\s\S]*?<\/title>/, `<title>${title}</title>`, 'title');
  out = replaceOrThrow(
    out,
    /<meta name="description"[^>]*>/,
    `<meta name="description" content="${description}" />`,
    'description'
  );
  out = replaceOrThrow(
    out,
    /<link rel="canonical"[^>]*>/,
    `<link rel="canonical" href="${canonical}" />`,
    'canonical'
  );

  out = replaceOrThrow(out, /<meta property="og:type"[^>]*>/, `<meta property="og:type" content="${v.ogType}" />`, 'og:type');
  out = replaceOrThrow(out, /<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${canonical}" />`, 'og:url');
  out = replaceOrThrow(out, /<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${title}" />`, 'og:title');
  out = replaceOrThrow(
    out,
    /<meta property="og:description"[^>]*>/,
    `<meta property="og:description" content="${description}" />`,
    'og:description'
  );
  out = replaceOrThrow(out, /<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${image}" />`, 'og:image');
  out = replaceOrThrow(
    out,
    /<meta property="og:image:width"[^>]*>/,
    `<meta property="og:image:width" content="${v.imageWidth}" />`,
    'og:image:width'
  );
  out = replaceOrThrow(
    out,
    /<meta property="og:image:height"[^>]*>/,
    `<meta property="og:image:height" content="${v.imageHeight}" />`,
    'og:image:height'
  );
  out = replaceOrThrow(
    out,
    /<meta property="og:image:type"[^>]*>/,
    `<meta property="og:image:type" content="${imageMimeType(v.image)}" />`,
    'og:image:type'
  );

  out = replaceOrThrow(out, /<meta name="twitter:card"[^>]*>/, `<meta name="twitter:card" content="${v.twitterCard}" />`, 'twitter:card');
  out = replaceOrThrow(out, /<meta name="twitter:url"[^>]*>/, `<meta name="twitter:url" content="${canonical}" />`, 'twitter:url');
  out = replaceOrThrow(
    out,
    /<meta name="twitter:title"[^>]*>/,
    `<meta name="twitter:title" content="${escapeHtml(v.twitterTitle)}" />`,
    'twitter:title'
  );
  out = replaceOrThrow(
    out,
    /<meta name="twitter:description"[^>]*>/,
    `<meta name="twitter:description" content="${escapeHtml(v.twitterDescription)}" />`,
    'twitter:description'
  );
  out = replaceOrThrow(out, /<meta name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${image}" />`, 'twitter:image');
  out = replaceOrThrow(
    out,
    /<meta property="og:image:alt"[^>]*>/,
    `<meta property="og:image:alt" content="${escapeHtml(v.imageAlt)}" />`,
    'og:image:alt'
  );
  out = replaceOrThrow(
    out,
    /<meta name="twitter:image:alt"[^>]*>/,
    `<meta name="twitter:image:alt" content="${escapeHtml(v.imageAlt)}" />`,
    'twitter:image:alt'
  );

  if (v.jsonLd?.length) {
    // Um nome de perfil contendo "</script>" fecharia o bloco JSON-LD e
    // injetaria markup na página; escapar "<" impede isso.
    const blocks = v.jsonLd
      .map(
        (schema) =>
          `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>`
      )
      .join('\n    ');
    out = out.replace('</head>', `  ${blocks}\n  </head>`);
  }

  return out;
}
