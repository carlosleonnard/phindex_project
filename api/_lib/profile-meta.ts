/**
 * META TAGS DE PERFIL (profile-meta.ts)
 *
 * Compartilhado por /profile/:id e /user-profile/:slug. Cada pessoa é
 * acessível pelas duas rotas, então ambas produzem exatamente as mesmas tags e
 * apontam o canonical para a URL do slug — consolidando o sinal de ranking em
 * uma única URL em vez de dividi-lo entre duas páginas idênticas.
 *
 * A foto da prévia passa pelo redimensionamento do Supabase (og-image.ts):
 * a original pode ter 2 MB, e o WhatsApp não mostra prévias pesadas.
 */

import { SITE_URL, DEFAULT_OG_IMAGE, DEFAULT_OG_IMAGE_ALT, injectMeta, readIndexHtml } from './prerender.js';
import { SHARE_PHOTO_SIZE, sharePhotoUrl } from './og-image.js';
import { createServerClient } from './supabase.js';

export type ProfileRow = {
  id: string;
  slug: string | null;
  name: string;
  front_image_url: string | null;
  ancestry: string | null;
  country: string | null;
  gender: string | null;
  category: string | null;
  subcategory: string | null;
};

const COLUMNS = 'id, slug, name, front_image_url, ancestry, country, gender, category, subcategory';

/** "User Profiles" é como o banco chama a categoria Community. */
const COMMUNITY_DB_NAME = 'User Profiles';

/** Perfis antigos guardam o gênero em português (espelho de src/constants/genders.ts). */
const LEGACY_GENDERS: Record<string, string> = { Masculino: 'Male', Feminino: 'Female', Outro: 'Other' };

/** Busca um perfil por slug ou por id. */
export async function fetchProfile(
  by: 'slug' | 'id',
  value: string
): Promise<ProfileRow | null> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('user_profiles')
    .select(COLUMNS)
    .eq(by, value)
    .single();
  if (!data) return null;
  // Há nomes gravados com espaço no fim ("Darius "), que vazariam para o título.
  const row = data as ProfileRow;
  return { ...row, name: (row.name || '').trim() };
}

/** URL canônica: o slug quando existe, senão o id. */
export function canonicalProfileUrl(profile: ProfileRow): string {
  return profile.slug
    ? `${SITE_URL}/user-profile/${profile.slug}`
    : `${SITE_URL}/profile/${profile.id}`;
}

/** Foto relativa (/phindex-uploads/…) vira absoluta; crawlers não resolvem caminhos. */
function absoluteUrl(url: string): string {
  return /^https?:\/\//.test(url) ? url : `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

/** Categoria para exibição e para o link: Community ou o nome da categoria. */
function categoryOf(profile: ProfileRow): { name: string; slug: string } | null {
  if (!profile.category) return null;
  if (profile.category === COMMUNITY_DB_NAME) return { name: 'Community', slug: 'community' };
  return { name: profile.category, slug: profile.category.toLowerCase().replace(/\s+/g, '-') };
}

/** Título com os termos que as pessoas buscam: o nome, "phenotype" e "ancestry". */
export function profileTitle(name: string): string {
  return `${name} Phenotype & Ancestry | Phindex`;
}

/**
 * Descrição legível, omitindo campos ausentes em vez de escrever "null".
 * O que importa vem primeiro: o Google corta por volta de 155 caracteres.
 */
export function profileDescription(profile: ProfileRow): string {
  const category = categoryOf(profile);
  const kind = category && category.slug !== 'community' ? profile.subcategory || category.name : null;
  const lead = kind ? `${profile.name} (${kind})` : profile.name;
  const facts: string[] = [];
  if (profile.ancestry) facts.push(`Ancestry: ${profile.ancestry}.`);
  if (profile.country) facts.push(`Country: ${profile.country}.`);
  return [
    `${lead} on Phindex: how the community reads their phenotype, region and ten physical traits.`,
    ...facts,
    'Add your vote.',
  ].join(' ');
}

/** Monta o HTML pré-renderizado para um perfil. */
export function renderProfileHtml(profile: ProfileRow): string {
  const url = canonicalProfileUrl(profile);
  const photo = profile.front_image_url ? absoluteUrl(profile.front_image_url) : null;
  const image = photo ? sharePhotoUrl(photo) : DEFAULT_OG_IMAGE;
  const description = profileDescription(profile);
  const category = categoryOf(profile);

  const person: Record<string, unknown> = {
    '@type': 'Person',
    name: profile.name,
    url,
    description,
  };
  if (profile.country) person.nationality = profile.country;
  if (photo) person.image = photo;
  if (profile.gender) person.gender = LEGACY_GENDERS[profile.gender] ?? profile.gender;

  const profilePageSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url,
    name: profileTitle(profile.name),
    mainEntity: person,
  };

  const crumbs = [{ name: 'Home', item: SITE_URL }];
  if (category) crumbs.push({ name: category.name, item: `${SITE_URL}/category/${category.slug}` });
  crumbs.push({ name: profile.name, item: url });
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({ '@type': 'ListItem', position: index + 1, ...crumb })),
  };

  return injectMeta(readIndexHtml(), {
    title: profileTitle(profile.name),
    description,
    canonical: url,
    image,
    imageAlt: photo ? `Photo of ${profile.name}` : DEFAULT_OG_IMAGE_ALT,
    // A foto sai quadrada do redimensionamento; o card padrão é 1200x630.
    imageWidth: photo ? String(SHARE_PHOTO_SIZE) : '1200',
    imageHeight: photo ? String(SHARE_PHOTO_SIZE) : '630',
    ogType: 'profile',
    // Uma foto quadrada no card grande do X seria cortada em 2:1, na altura dos olhos.
    twitterCard: photo ? 'summary' : 'summary_large_image',
    twitterTitle: `${profile.name} | Phindex`,
    twitterDescription: description,
    jsonLd: [profilePageSchema, breadcrumbSchema],
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
