/** Pré-renderização de /category/:slug para crawlers (ver _lib/listing-meta.ts). */
import { handleListingRequest, renderCategoryHtml } from '../_lib/listing-meta.js';

export default function handler(req: any, res: any) {
  const { slug } = req.query;
  const valid = typeof slug === 'string' && /^[a-z0-9-]+$/.test(slug);
  return handleListingRequest(res, () => (valid ? renderCategoryHtml(slug) : null));
}
