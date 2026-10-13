/**
 * Pré-renderização de /profile/:id.
 *
 * Sem esta rota, todo compartilhamento de um link /profile/:id entregava ao
 * crawler o index.html genérico — os crawlers não executam JavaScript, então as
 * tags do react-helmet nunca chegavam até eles. As meta tags aqui apontam o
 * canonical para a URL do slug, consolidando as duas rotas em uma só.
 */
import { handleProfileRequest } from '../_lib/profile-meta.js';

const UUID_RE = /^[0-9a-fA-F-]{36}$/;

export default async function handler(req: any, res: any) {
  const { id } = req.query;

  if (!id || typeof id !== 'string' || !UUID_RE.test(id)) {
    return res.status(400).send('Invalid id');
  }

  return handleProfileRequest(res, 'id', id);
}
