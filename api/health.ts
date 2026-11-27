import type { VercelRequest, VercelResponse } from '@vercel/node';
import { healthHandler } from './_lib/handlers/health';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await healthHandler(req, res);
}
