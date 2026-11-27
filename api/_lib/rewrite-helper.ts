import type { VercelRequest } from '@vercel/node';

export function restoreRewrittenUrl(req: VercelRequest): void {
  const rawRoute = req.query?.__route;
  if (typeof rawRoute === 'string' && rawRoute.startsWith('/api/')) {
    const qIndex = (req.url || '').indexOf('?');
    const qs = qIndex >= 0 ? (req.url || '').slice(qIndex + 1) : '';
    const params = new URLSearchParams(qs);
    params.delete('__route');
    const cleanedQs = params.toString();
    req.url = cleanedQs ? `${rawRoute}?${cleanedQs}` : rawRoute;
  }
}
