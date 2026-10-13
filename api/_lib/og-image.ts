/**
 * IMAGEM DE COMPARTILHAMENTO DO PERFIL (og-image.ts)
 *
 * As fotos sobem do celular com até ~2 MB. O WhatsApp descarta a prévia
 * quando a imagem é pesada (na prática, acima de ~300 KB), e o Facebook usa
 * as dimensões declaradas antes de baixar o arquivo. O Supabase redimensiona
 * na hora pelo endpoint render/image: 800×800 em JPEG fica entre 30 e 90 KB,
 * e as dimensões declaradas passam a ser as reais.
 *
 * `format=origin` mantém o formato original (JPEG/PNG) mesmo para clientes
 * que aceitam WebP — nem todo app de mensagem mostra WebP na prévia.
 *
 * O espelho desta função para o navegador está em src/lib/og-image.ts.
 */

const OBJECT_PATH = '/storage/v1/object/public/';
const RENDER_PATH = '/storage/v1/render/image/public/';

export const SHARE_PHOTO_SIZE = 800;

/** URL leve e quadrada para og:image; fotos de fora do Storage passam como estão. */
export function sharePhotoUrl(url: string): string {
  if (!url.includes(OBJECT_PATH)) return url;
  const base = url.split('?')[0].replace(OBJECT_PATH, RENDER_PATH);
  return `${base}?width=${SHARE_PHOTO_SIZE}&height=${SHARE_PHOTO_SIZE}&resize=cover&quality=80&format=origin`;
}

/** Só fotos do Storage têm o tamanho garantido pelo redimensionamento. */
export function isResizedPhoto(url: string): boolean {
  return url.includes(OBJECT_PATH);
}
