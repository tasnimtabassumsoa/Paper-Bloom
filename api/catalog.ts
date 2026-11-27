import type { VercelRequest, VercelResponse } from '@vercel/node';
import { catalogHandler } from './_lib/handlers/catalog';
import { restoreRewrittenUrl } from './_lib/rewrite-helper';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  restoreRewrittenUrl(req);
  await catalogHandler(req, res);
}
