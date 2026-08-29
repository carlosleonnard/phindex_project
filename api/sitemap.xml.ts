/**
 * SITEMAP DINÂMICO (sitemap.xml.ts)
 *
 * As listas de categorias e regiões vêm de api/_lib/routes.ts, que tem um teste
 * de consistência contra src/constants — antes eram duplicadas inline aqui e
 * ficaram desatualizadas quando "criminals", "religion" e "military" surgiram.
 *
 * Cada perfil aparece uma única vez, na URL do slug. Emitir também /profile/{id}
 * criava conteúdo duplicado: duas URLs idênticas por pessoa, dividindo o sinal
 * de ranking entre elas.
 */

import { createClient } from '@supabase/supabase-js';
import { CATEGORY_SLUGS, REGION_SLUGS } from './_lib/routes';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const BASE_URL = "https://www.phenotypeindex.com";

type SitemapEntry = {
  url: string;
  priority: string;
  changefreq: string;
  lastmod: string;
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
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, slug, updated_at, profile_type')
      .order('updated_at', { ascending: false })
      .limit(50000);

    const today = new Date().toISOString().split('T')[0];

    // Páginas dependentes de estado do cliente (/saved, /settings) ficam de
    // fora: são noindex.
    const staticPages: SitemapEntry[] = [
      { url: `${BASE_URL}/`, priority: '1.0', changefreq: 'daily', lastmod: today },
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
    }));

    const allPages = [...staticPages, ...regionPages, ...categoryPages, ...profilePages];

    const xmlUrls = allPages
      .map(page => `  <url>
    <loc>${escapeXml(page.url)}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`)
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
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
