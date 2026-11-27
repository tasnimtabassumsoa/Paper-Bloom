import type { VercelRequest, VercelResponse } from '@vercel/node';
import { meHandler } from './_lib/handlers/me';
import { restoreRewrittenUrl } from './_lib/rewrite-helper';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  restoreRewrittenUrl(req);
  await meHandler(req, res);
}
