/**
 * SITEMAP DINÂMICO (sitemap.xml.ts)
 *
 * As listas de categorias e regiões vêm de api/_lib/routes.ts, que tem um teste
 * de consistência contra src/constants — antes eram duplicadas inline aqui e
 * ficaram desatualizadas quando "criminals", "religion" e "military" surgiram.
 *
 * Cada perfil aparece uma única vez, na URL do slug. Emitir também /profile/{id}
 * criava conteúdo duplicado: duas URLs idênticas por pessoa, dividindo o sinal
 * de ranking entre elas. A foto de frente entra como <image:image>, para o
 * Google Imagens.
 *
 * A consulta pedia uma coluna que não existe (profile_type); o PostgREST
 * devolvia erro e o sitemap saía sem nenhum perfil. O erro agora vai para o
 * log em vez de passar em silêncio.
 */

import { CATEGORY_SLUGS, REGION_SLUGS } from './_lib/routes.js';
import { createServerClient } from './_lib/supabase.js';

const BASE_URL = "https://www.phenotypeindex.com";

type SitemapEntry = {
  url: string;
  priority: string;
  changefreq: string;
  lastmod: string;
  image?: string;
};

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default async function handler(req: any, res: any) {
  try {
    const supabase = createServerClient();

    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('id, slug, updated_at, front_image_url')
      .order('updated_at', { ascending: false })
      .limit(50000);
    if (error) console.error('Sitemap profile query failed:', error.message);

    const today = new Date().toISOString().split('T')[0];

    // Páginas dependentes de estado do cliente (/saved, /settings) ficam de
    // fora: são noindex.
    const staticPages: SitemapEntry[] = [
      { url: `${BASE_URL}/`, priority: '1.0', changefreq: 'daily', lastmod: today },
      { url: `${BASE_URL}/community`, priority: '0.9', changefreq: 'daily', lastmod: today },
      { url: `${BASE_URL}/explore`, priority: '0.8', changefreq: 'daily', lastmod: today },
      { url: `${BASE_URL}/game`, priority: '0.7', changefreq: 'weekly', lastmod: today },
      { url: `${BASE_URL}/leaderboard`, priority: '0.5', changefreq: 'daily', lastmod: today },
      { url: `${BASE_URL}/faq`, priority: '0.5', changefreq: 'monthly', lastmod: today },
      { url: `${BASE_URL}/contact`, priority: '0.5', changefreq: 'monthly', lastmod: today },
      { url: `${BASE_URL}/phenotype-flow`, priority: '0.5', changefreq: 'monthly', lastmod: today },
    ];

    const regionPages: SitemapEntry[] = REGION_SLUGS.map((slug) => ({
      url: `${BASE_URL}/region/${slug}`,
      priority: '0.7',
      changefreq: 'weekly',
      lastmod: today,
    }));

    const categoryPages: SitemapEntry[] = CATEGORY_SLUGS.map((slug) => ({
      url: `${BASE_URL}/category/${slug}`,
      priority: '0.6',
      changefreq: 'weekly',
      lastmod: today,
    }));

    // Uma URL por perfil: o slug é o canônico, com fallback para o id quando
    // o perfil ainda não tem slug.
    const profilePages: SitemapEntry[] = (profiles || []).map((p) => ({
      url: p.slug
        ? `${BASE_URL}/user-profile/${p.slug}`
        : `${BASE_URL}/profile/${p.id}`,
      priority: '0.8',
      changefreq: 'weekly',
      lastmod: p.updated_at ? p.updated_at.split('T')[0] : today,
      image: p.front_image_url && /^https?:\/\//.test(p.front_image_url) ? p.front_image_url : undefined,
    }));

    const allPages = [...staticPages, ...regionPages, ...categoryPages, ...profilePages];

    const xmlUrls = allPages
      .map(page => `  <url>
    <loc>${escapeXml(page.url)}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>${
      page.image
        ? `
    <image:image>
      <image:loc>${escapeXml(page.image)}</image:loc>
    </image:image>`
        : ''
    }
  </url>`)
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${xmlUrls}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
    return res.status(200).send(xml);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return res.status(500).send('Internal Server Error');
  }
}
