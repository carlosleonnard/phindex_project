/**
 * CONSTANTES DE SEO (seo.ts)
 *
 * Fonte única de verdade para host, imagem de compartilhamento padrão e handle
 * do Twitter. Antes esses valores estavam duplicados no index.html e em cada
 * página, o que fez o handle divergir (@phindex vs @phenotypeindex) e a imagem
 * OG apontar para arquivos diferentes.
 */

export const SITE_URL = "https://www.phenotypeindex.com";
export const SITE_NAME = "Phindex - Phenotype Index";
export const TWITTER_HANDLE = "@phenotypeindex";

/** Card de compartilhamento padrão (1200x630). */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;
export const DEFAULT_OG_IMAGE_WIDTH = "1200";
export const DEFAULT_OG_IMAGE_HEIGHT = "630";

/** Monta uma URL absoluta a partir de um caminho relativo à raiz. */
export const absoluteUrl = (path: string): string =>
  path.startsWith("http") ? path : `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

/**
 * URL canônica de um perfil.
 *
 * Cada pessoa é acessível por /profile/{id} e /user-profile/{slug}. O slug é o
 * canônico — é descritivo e carrega o nome como palavra-chave. Quando o slug
 * não existe (perfil antigo), o id continua sendo o canônico.
 */
export const canonicalProfileUrl = (
  slug: string | null | undefined,
  id: string
): string => (slug ? `${SITE_URL}/user-profile/${slug}` : `${SITE_URL}/profile/${id}`);
