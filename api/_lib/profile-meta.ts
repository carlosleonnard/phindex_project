/**
 * META TAGS DE PERFIL (profile-meta.ts)
 *
 * Compartilhado por /profile/:id e /user-profile/:slug. Cada pessoa é
 * acessível pelas duas rotas, então ambas produzem exatamente as mesmas tags e
 * apontam o canonical para a URL do slug — consolidando o sinal de ranking em
 * uma única URL em vez de dividi-lo entre duas páginas idênticas.
 */

import { createClient } from '@supabase/supabase-js';
import { SITE_URL, DEFAULT_OG_IMAGE, injectMeta, readIndexHtml } from './prerender';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export type ProfileRow = {
  id: string;
  slug: string | null;
  name: string;
  front_image_url: string | null;
  ancestry: string | null;
  country: string | null;
  gender: string | null;
};

const COLUMNS = 'id, slug, name, front_image_url, ancestry, country, gender';

/** Busca um perfil por slug ou por id. */
export async function fetchProfile(
  by: 'slug' | 'id',
  value: string
): Promise<ProfileRow | null> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data } = await supabase
    .from('user_profiles')
    .select(COLUMNS)
    .eq(by, value)
    .single();
  return (data as ProfileRow) || null;
}

/** URL canônica: o slug quando existe, senão o id. */
export function canonicalProfileUrl(profile: ProfileRow): string {
  return profile.slug
    ? `${SITE_URL}/user-profile/${profile.slug}`
    : `${SITE_URL}/profile/${profile.id}`;
}

/** Descrição legível, omitindo campos ausentes em vez de escrever "null". */
function buildDescription(profile: ProfileRow): string {
  const facts: string[] = [];
  if (profile.ancestry) facts.push(`Ancestry: ${profile.ancestry}.`);
  if (profile.country) facts.push(`Country: ${profile.country}.`);
  return [
    `View ${profile.name}'s phenotype classification on Phindex.`,
    ...facts,
    'Vote on physical characteristics and compare phenotypes.',
  ].join(' ');
}

/** Monta o HTML pré-renderizado para um perfil. */
export function renderProfileHtml(profile: ProfileRow): string {
  const url = canonicalProfileUrl(profile);
  const image = profile.front_image_url || DEFAULT_OG_IMAGE;
  const hasOwnImage = Boolean(profile.front_image_url);
  const description = buildDescription(profile);

  const personSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    url,
    description,
  };
  if (profile.country) personSchema.nationality = profile.country;
  if (profile.front_image_url) personSchema.image = profile.front_image_url;
  if (profile.gender) personSchema.gender = profile.gender;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: profile.name, item: url },
    ],
  };

  return injectMeta(readIndexHtml(), {
    title: `${profile.name} Phenotype Profile | Phindex - Phenotype Index`,
    description,
    canonical: url,
    image,
    // Fotos de perfil são quadradas; o card padrão é 1200x630.
    imageWidth: hasOwnImage ? '800' : '1200',
    imageHeight: hasOwnImage ? '800' : '630',
    ogType: 'profile',
    twitterCard: hasOwnImage ? 'summary' : 'summary_large_image',
    twitterTitle: `${profile.name} | Phindex`,
    twitterDescription: `View ${profile.name}'s phenotype profile on Phindex.`,
    jsonLd: [personSchema, breadcrumbSchema],
  });
}

/** Handler compartilhado pelas duas rotas de perfil. */
export async function handleProfileRequest(
  res: any,
  by: 'slug' | 'id',
  value: string
) {
  try {
    const profile = await fetchProfile(by, value);
    const html = profile ? renderProfileHtml(profile) : readIndexHtml();

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    return res.status(200).send(html);
  } catch (error) {
    console.error('Profile prerender error:', error);
    try {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(readIndexHtml());
    } catch {
      return res.status(500).send('Internal Server Error');
    }
  }
}
