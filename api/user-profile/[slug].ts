import { handleProfileRequest } from '../_lib/profile-meta.js';

export default async function handler(req: any, res: any) {
  const { slug } = req.query;

  if (!slug || typeof slug !== 'string' || !/^[a-zA-Z0-9-]+$/.test(slug)) {
    return res.status(400).send('Invalid slug');
  }

  return handleProfileRequest(res, 'slug', slug);
}
