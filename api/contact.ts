import type { VercelRequest, VercelResponse } from '@vercel/node';
import { contactHandler } from './_lib/handlers/forms';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await contactHandler(req, res);
}
