import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cartHandler } from './_lib/handlers/cart';
import { restoreRewrittenUrl } from './_lib/rewrite-helper';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  restoreRewrittenUrl(req);
  await cartHandler(req, res);
}
