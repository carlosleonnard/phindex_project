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
  const { id } = req.query;

  // Validate id format (UUID)
  if (!id || typeof id !== 'string' || !/^[a-f0-9-]+$/i.test(id)) {
    return res.status(400).send('Invalid id');
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, name, front_image_url, ancestry, country, gender, slug')
      .eq('id', id as string)
      .single();

    // Read the built index.html
    let html: string;
    try {
      html = readFileSync(join(process.cwd(), 'dist', 'index.html'), 'utf-8');
    } catch {
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
      const url = `https://www.phenotypeindex.com/profile/${profile.id}`;
      const keywords = escapeHtml(
        `${profile.name} phenotype, ${profile.name} ancestry, ${profile.name} physical traits, ${profile.country} phenotype, ${profile.name} classification, phenotype index`
      );

      // JSON-LD structured data
      const jsonLd = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Person",
        "name": profile.name,
        "nationality": profile.country,
        "image": profile.front_image_url || '',
        "url": url,
        "description": `${profile.name}'s phenotype classification. Ancestry: ${profile.ancestry}. Country: ${profile.country}.`
      });

      // Replace existing meta tags with profile-specific ones
      html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
      html = html.replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${description}">`);
      html = html.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`);

      // Add keywords meta tag before canonical
      html = html.replace(/<link rel="canonical"/, `<meta name="keywords" content="${keywords}" />\n    <link rel="canonical"`);

      // Replace Open Graph tags
      html = html.replace(/<meta property="og:type"[^>]*>/, `<meta property="og:type" content="profile" />`);
      html = html.replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`);
      html = html.replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${title}">`);
      html = html.replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${description}">`);
      html = html.replace(/<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${image}">`);
      html = html.replace(/<meta property="og:image:width"[^>]*>/, `<meta property="og:image:width" content="800" />`);
      html = html.replace(/<meta property="og:image:height"[^>]*>/, `<meta property="og:image:height" content="800" />`);

      // Replace Twitter tags
      html = html.replace(/<meta name="twitter:card"[^>]*>/, `<meta name="twitter:card" content="summary_large_image" />`);
      html = html.replace(/<meta name="twitter:url"[^>]*>/, `<meta name="twitter:url" content="${url}" />`);
      html = html.replace(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${shortTitle}">`);
      html = html.replace(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${shortDescription}">`);
      html = html.replace(/<meta name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${image}">`);

      // Inject JSON-LD before closing </head>
      html = html.replace('</head>', `<script type="application/ld+json">${jsonLd}</script>\n  </head>`);
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    return res.status(200).send(html);
  } catch (error) {
    console.error('OG preview error:', error);
    try {
      const html = readFileSync(join(process.cwd(), 'dist', 'index.html'), 'utf-8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    } catch {
      return res.status(500).send('Internal Server Error');
    }
  }
}
