import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default async function handler(req: any, res: any) {
  const { slug } = req.query;

  // Validate slug format
  if (!slug || typeof slug !== 'string' || !/^[a-zA-Z0-9-]+$/.test(slug)) {
    return res.status(400).send('Invalid slug');
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('name, front_image_url, ancestry, country, gender, slug')
      .eq('slug', slug as string)
      .single();

    // Read the built index.html
    let html: string;
    try {
      html = readFileSync(join(process.cwd(), 'dist', 'index.html'), 'utf-8');
    } catch {
      // Fallback for development
      html = readFileSync(join(process.cwd(), 'index.html'), 'utf-8');
    }

    if (profile) {
      const title = escapeHtml(`${profile.name} Phenotype Profile | Phindex - Phenotype Index`);
      const shortTitle = escapeHtml(`${profile.name} | Phindex`);
      const description = escapeHtml(
        `View ${profile.name}'s phenotype classification on Phindex. Ancestry: ${profile.ancestry}. Country: ${profile.country}. Vote on physical characteristics and compare phenotypes.`
      );
      const shortDescription = escapeHtml(`View ${profile.name}'s phenotype profile on Phindex.`);
      const image = escapeHtml(profile.front_image_url || '');
      const url = `https://www.phenotypeindex.com/user-profile/${slug}`;

      // Replace existing meta tags with profile-specific ones
      html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
      html = html.replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${description}">`);
      html = html.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`);

      // Replace Open Graph tags
      html = html.replace(/<meta property="og:type"[^>]*>/, `<meta property="og:type" content="profile" />`);
      html = html.replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`);
      html = html.replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${title}">`);
      html = html.replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${description}">`);
      html = html.replace(/<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${image}">`);
      html = html.replace(/<meta property="og:image:width"[^>]*>/, `<meta property="og:image:width" content="800" />`);
      html = html.replace(/<meta property="og:image:height"[^>]*>/, `<meta property="og:image:height" content="800" />`);

      // Replace Twitter tags
      html = html.replace(/<meta name="twitter:card"[^>]*>/, `<meta name="twitter:card" content="summary" />`);
      html = html.replace(/<meta name="twitter:url"[^>]*>/, `<meta name="twitter:url" content="${url}" />`);
      html = html.replace(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${shortTitle}">`);
      html = html.replace(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${shortDescription}">`);
      html = html.replace(/<meta name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${image}">`);
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    return res.status(200).send(html);
  } catch (error) {
    console.error('OG preview error:', error);
    // Fallback: serve plain index.html
    try {
      const html = readFileSync(join(process.cwd(), 'dist', 'index.html'), 'utf-8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    } catch {
      return res.status(500).send('Internal Server Error');
    }
  }
}
