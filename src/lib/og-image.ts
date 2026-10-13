/**
 * FOTOS REDIMENSIONADAS (og-image.ts)
 *
 * O Supabase Storage serve o arquivo original em /object/public/ — e os
 * originais aqui vão de 200 KB a 4,9 MB. O endpoint /render/image/public/
 * redimensiona na hora: um retrato de 1,6 MB vira 8 KB em WebP a 440px.
 *
 * `sharePhotoUrl` é a imagem quadrada das prévias de link, espelhada em
 * api/_lib/og-image.ts porque a função serverless não importa de src/.
 * `photoUrl` é a mesma ideia para as fotos exibidas no site.
 */

const OBJECT_PATH = "/storage/v1/object/public/";
const RENDER_PATH = "/storage/v1/render/image/public/";

export const SHARE_PHOTO_SIZE = 800;

/** Só fotos do Storage podem ser redimensionadas; o resto passa como está. */
const isStoragePhoto = (url: string) => url.includes(OBJECT_PATH);

const renderBase = (url: string) => url.split("?")[0].replace(OBJECT_PATH, RENDER_PATH);

/**
 * URL quadrada e leve para og:image.
 *
 * `format=origin` mantém JPEG/PNG: nem todo app de mensagem mostra WebP na
 * prévia, e a prévia é o único lugar onde isso importa.
 */
export function sharePhotoUrl(url: string): string {
  if (!isStoragePhoto(url)) return url;
  return `${renderBase(url)}?width=${SHARE_PHOTO_SIZE}&height=${SHARE_PHOTO_SIZE}&resize=cover&quality=80&format=origin`;
}

/**
 * URL redimensionada para exibir no site. Sem `format=origin`: aqui quem
 * carrega é o navegador, que recebe WebP quando aceita.
 */
export function photoUrl(url: string, width: number, height: number, quality = 72): string {
  if (!isStoragePhoto(url)) return url;
  return `${renderBase(url)}?width=${Math.round(width)}&height=${Math.round(height)}&resize=cover&quality=${quality}`;
}

/** `srcset` 1x/2x para uma caixa de `width`x`height`. Vazio fora do Storage. */
export function photoSrcSet(url: string, width: number, height: number, quality = 72): string | undefined {
  if (!isStoragePhoto(url)) return undefined;
  return [1, 2].map((dpr) => `${photoUrl(url, width * dpr, height * dpr, quality)} ${dpr}x`).join(", ");
}
