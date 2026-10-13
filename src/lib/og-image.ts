/**
 * IMAGEM DE COMPARTILHAMENTO DO PERFIL (og-image.ts)
 *
 * Espelho de api/_lib/og-image.ts para as tags do react-helmet: o Google lê
 * as tags depois de executar o JavaScript, e elas precisam apontar para a
 * mesma imagem leve que os crawlers de redes sociais recebem do servidor.
 * As duas cópias existem porque a função serverless não importa de src/.
 */

const OBJECT_PATH = "/storage/v1/object/public/";
const RENDER_PATH = "/storage/v1/render/image/public/";

export const SHARE_PHOTO_SIZE = 800;

/** URL leve e quadrada para og:image; fotos de fora do Storage passam como estão. */
export function sharePhotoUrl(url: string): string {
  if (!url.includes(OBJECT_PATH)) return url;
  const base = url.split("?")[0].replace(OBJECT_PATH, RENDER_PATH);
  return `${base}?width=${SHARE_PHOTO_SIZE}&height=${SHARE_PHOTO_SIZE}&resize=cover&quality=80&format=origin`;
}
