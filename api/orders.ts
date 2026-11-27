import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ordersHandler } from './_lib/handlers/orders';
import { restoreRewrittenUrl } from './_lib/rewrite-helper';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  restoreRewrittenUrl(req);
  await ordersHandler(req, res);
}
