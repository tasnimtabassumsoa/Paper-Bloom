import type { VercelRequest, VercelResponse } from '@vercel/node';
import { wishlistHandler } from './_lib/handlers/wishlist';
import { restoreRewrittenUrl } from './_lib/rewrite-helper';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  restoreRewrittenUrl(req);
  await wishlistHandler(req, res);
}
