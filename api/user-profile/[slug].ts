import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = "https://jmygqrqfzglbislftczz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpteWdxcnFmemdsYmlzbGZ0Y3p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NjEyMTIsImV4cCI6MjA3MDQzNzIxMn0.-SATJkWJNhgpGY8g1o_REhIy-xhaKWIN8_Yrxrzzd1A";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default async function handler(req: any, res: any) {
  const { slug } = req.query;

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
      const title = escapeHtml(`${profile.name} | Phindex - Phenotype Index`);
      const description = escapeHtml(
        `View ${profile.name}'s phenotype profile on Phindex. Ancestry: ${profile.ancestry}. Country: ${profile.country}.`
      );
      const image = profile.front_image_url;
      const url = `https://www.phenotypeindex.com/user-profile/${slug}`;

      const ogTags = `
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="800" />
  <meta property="og:image:height" content="800" />
  <meta property="og:url" content="${url}" />
  <meta property="og:type" content="profile" />
  <meta property="og:site_name" content="Phindex - Phenotype Index" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <meta name="twitter:image:src" content="${image}" />`;

      // Replace existing title and inject OG tags
      html = html.replace(
        /<title>.*?<\/title>/,
        `<title>${title}</title>`
      );
      html = html.replace('</head>', `${ogTags}\n</head>`);
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
