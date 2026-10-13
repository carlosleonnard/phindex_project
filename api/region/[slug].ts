/** Pré-renderização de /region/:slug para crawlers (ver _lib/listing-meta.ts). */
import { handleListingRequest, renderRegionHtml } from '../_lib/listing-meta.js';

export default function handler(req: any, res: any) {
  const { slug } = req.query;
  const valid = typeof slug === 'string' && /^[a-z0-9-]+$/.test(slug);
  return handleListingRequest(res, () => (valid ? renderRegionHtml(slug) : null));
}
