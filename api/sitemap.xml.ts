import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://jmygqrqfzglbislftczz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpteWdxcnFmemdsYmlzbGZ0Y3p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NjEyMTIsImV4cCI6MjA3MDQzNzIxMn0.-SATJkWJNhgpGY8g1o_REhIy-xhaKWIN8_Yrxrzzd1A";

const BASE_URL = "https://www.phenotypeindex.com";

export default async function handler(req: any, res: any) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('slug, updated_at')
      .order('updated_at', { ascending: false })
      .limit(50000);

    const today = new Date().toISOString().split('T')[0];

    const staticPages = [
      { url: `${BASE_URL}/`, priority: '1.0', changefreq: 'daily', lastmod: today },
      { url: `${BASE_URL}/leaderboard`, priority: '0.5', changefreq: 'daily', lastmod: today },
      { url: `${BASE_URL}/faq`, priority: '0.5', changefreq: 'monthly', lastmod: today },
      { url: `${BASE_URL}/contact`, priority: '0.5', changefreq: 'monthly', lastmod: today },
      { url: `${BASE_URL}/phenotype-flow`, priority: '0.5', changefreq: 'monthly', lastmod: today },
    ];

    const regions = ['africa', 'europe', 'asia', 'americas', 'middle-east', 'oceania'];
    const regionPages = regions.map(r => ({
      url: `${BASE_URL}/region/${r}`,
      priority: '0.7',
      changefreq: 'weekly',
      lastmod: today,
    }));

    const categories = ['community', 'pop-culture', 'music-and-entertainment', 'arts', 'philosophy', 'sciences', 'sports', 'business', 'politics'];
    const categoryPages = categories.map(c => ({
      url: `${BASE_URL}/category/${c}`,
      priority: '0.6',
      changefreq: 'weekly',
      lastmod: today,
    }));

    const profilePages = (profiles || []).map(p => ({
      url: `${BASE_URL}/user-profile/${p.slug}`,
      priority: '0.8',
      changefreq: 'weekly',
      lastmod: p.updated_at ? p.updated_at.split('T')[0] : today,
    }));

    const allPages = [...staticPages, ...regionPages, ...categoryPages, ...profilePages];

    const xmlUrls = allPages
      .map(page => `  <url>
    <loc>${page.url}</loc>
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
