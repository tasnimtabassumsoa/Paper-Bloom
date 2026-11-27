import { getServerEnv } from './env';
import { getClientIp, HttpError, type ApiRequestLike } from './http';
import { createServiceSupabase } from './supabase';

const memoryBuckets = new Map<string, { hits: number; resetAt: number }>();

export async function enforceRateLimit(
  req: ApiRequestLike,
  scope: string,
  maxHits: number,
  windowSeconds: number,
): Promise<void> {
  const ip = getClientIp(req);
  const key = `${scope}:${ip}`;
  const env = getServerEnv();

  if (env.supabaseConfigured) {
    try {
      const service = createServiceSupabase();
      const { data, error } = await service.rpc('check_rate_limit', {
        p_key: key,
        p_max_hits: maxHits,
        p_window_seconds: windowSeconds,
      });
      if (!error && data === false) {
        throw new HttpError(
          429,
          'RATE_LIMITED',
          'Too many requests. Please wait a moment and try again.',
        );
      }
      if (!error) return;
    } catch (err) {
      if (err instanceof HttpError) throw err;
    }
  }

  // Fallback in-memory best-effort limiter
  const now = Date.now();
  const existing = memoryBuckets.get(key);
  if (!existing || existing.resetAt < now) {
    memoryBuckets.set(key, { hits: 1, resetAt: now + windowSeconds * 1000 });
    return;
  }

  if (existing.hits >= maxHits) {
    throw new HttpError(
      429,
      'RATE_LIMITED',
      'Too many requests. Please wait a moment and try again.',
    );
  }

  existing.hits += 1;
}

export function resetMemoryRateLimitsForTests(): void {
  memoryBuckets.clear();
}
