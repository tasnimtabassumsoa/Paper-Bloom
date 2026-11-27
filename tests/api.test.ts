import { beforeEach, describe, expect, it } from 'vitest';
import { resetServerEnvCacheForTests } from '../api/_lib/env';
import { cartHandler } from '../api/_lib/handlers/cart';
import { catalogHandler } from '../api/_lib/handlers/catalog';
import { contactHandler, newsletterHandler } from '../api/_lib/handlers/forms';
import { healthHandler } from '../api/_lib/handlers/health';
import { ordersHandler } from '../api/_lib/handlers/orders';
import type { ApiRequestLike, ApiResponseLike } from '../api/_lib/http';
import { resetMemoryRateLimitsForTests } from '../api/_lib/rate-limit';

function invokeHandler(
  handler: (req: ApiRequestLike, res: ApiResponseLike) => Promise<void>,
  options: {
    method?: string;
    url: string;
    body?: unknown;
    headers?: Record<string, string>;
  },
): Promise<{ status: number; json: Record<string, unknown> }> {
  return new Promise((resolve) => {
    let bodyText = '';
    const headersMap: Record<string, string> = {};
    const res: ApiResponseLike = {
      statusCode: 200,
      setHeader(name, val) {
        headersMap[name.toLowerCase()] = String(val);
      },
      end(chunk) {
        if (chunk) bodyText += chunk;
        resolve({
          status: res.statusCode,
          json: bodyText ? (JSON.parse(bodyText) as Record<string, unknown>) : {},
        });
      },
    };
    const req: ApiRequestLike = {
      method: options.method ?? 'GET',
      url: options.url,
      headers: {
        'x-forwarded-for': '203.0.113.10',
        ...(options.headers ?? {}),
      },
      body: options.body,
    };
    void handler(req, res);
  });
}

describe('Paper Bloom API handlers (Demo Mode / Contract)', () => {
  beforeEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    resetServerEnvCacheForTests();
    resetMemoryRateLimitsForTests();
  });

  it('GET /api/health reports demo mode truthfully when Supabase is unset', async () => {
    const res = await invokeHandler(healthHandler, { url: '/api/health' });
    expect(res.status).toBe(200);
    expect(res.json.ok).toBe(true);
    const data = res.json.data as Record<string, unknown>;
    expect(data.api).toBe(true);
    expect(data.mode).toBe('demo');
    expect(data.supabaseConfigured).toBe(false);
    expect(data.dbReachable).toBe(false);
  });

  it('GET /api/categories returns all 6 product families including Books & Learning', async () => {
    const res = await invokeHandler(catalogHandler, { url: '/api/categories' });
    expect(res.status).toBe(200);
    const cats = res.json.data as Array<{ slug: string }>;
    expect(cats.length).toBe(6);
    expect(cats.some((c) => c.slug === 'books-learning')).toBe(true);
  });

  it('GET /api/products supports filtering, sorting, and pagination', async () => {
    const res = await invokeHandler(catalogHandler, {
      url: '/api/products?category=custom-studio&customizable=true&sort=price_asc&pageSize=5',
    });
    expect(res.status).toBe(200);
    const items = res.json.data as Array<{ isCustomizable: boolean; basePriceBdt: number }>;
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((p) => p.isCustomizable)).toBe(true);
    for (let i = 1; i < items.length; i++) {
      expect(items[i]!.basePriceBdt).toBeGreaterThanOrEqual(items[i - 1]!.basePriceBdt);
    }
  });

  it('GET /api/products/:slug returns product + related, and 404 for unknown slug', async () => {
    const okRes = await invokeHandler(catalogHandler, {
      url: '/api/products/personalized-vegan-leather-journal',
    });
    expect(okRes.status).toBe(200);
    const data = okRes.json.data as { product: { slug: string }; related: unknown[] };
    expect(data.product.slug).toBe('personalized-vegan-leather-journal');
    expect(data.related.length).toBeGreaterThan(0);

    const notFound = await invokeHandler(catalogHandler, {
      url: '/api/products/non-existent-item-xyz',
    });
    expect(notFound.status).toBe(404);
  });

  it('blocks protected cart and orders endpoints when unauthenticated / unconfigured', async () => {
    const cartRes = await invokeHandler(cartHandler, { url: '/api/cart' });
    expect(cartRes.status).toBe(503);

    const orderRes = await invokeHandler(ordersHandler, {
      method: 'POST',
      url: '/api/orders',
      body: { totalBdt: 1 },
    });
    expect(orderRes.status).toBe(503);
  });

  it('validates contact form, enforces honeypot & rate limit', async () => {
    const bad = await invokeHandler(contactHandler, {
      method: 'POST',
      url: '/api/contact',
      body: { name: 'A', email: 'not-an-email', subject: 'Hi', message: 'Short' },
    });
    expect(bad.status).toBe(422);

    const good = await invokeHandler(contactHandler, {
      method: 'POST',
      url: '/api/contact',
      body: {
        name: 'Tasnim Ahmed',
        email: 'tasnim@example.com',
        phone: '01712345678',
        subject: 'Bulk notebook inquiry',
        message: 'Could you share pricing for 50 customized A5 journals?',
        website: '',
      },
    });
    expect(good.status).toBe(201);

    // Exhaust contact rate limit (max 5 in 300s)
    for (let i = 0; i < 4; i++) {
      await invokeHandler(contactHandler, {
        method: 'POST',
        url: '/api/contact',
        body: {
          name: 'Bot Check',
          email: 'check@example.com',
          subject: 'Testing rate limit',
          message: 'Testing message length over ten characters.',
          website: 'http://spam.example',
        },
      });
    }
    const limited = await invokeHandler(contactHandler, {
      method: 'POST',
      url: '/api/contact',
      body: {
        name: 'Tasnim',
        email: 'tasnim@example.com',
        subject: 'One too many',
        message: 'Testing rate limiting threshold properly.',
      },
    });
    expect(limited.status).toBe(429);
  });

  it('validates newsletter signups', async () => {
    const bad = await invokeHandler(newsletterHandler, {
      method: 'POST',
      url: '/api/newsletter',
      body: { email: 'invalid' },
    });
    expect(bad.status).toBe(422);

    const ok = await invokeHandler(newsletterHandler, {
      method: 'POST',
      url: '/api/newsletter',
      body: { email: 'reader@example.com' },
    });
    expect(ok.status).toBe(201);
  });
});
