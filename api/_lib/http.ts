import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { ZodError } from 'zod';
import type { ApiErrorDetail, ApiMeta, ApiResponse } from '../../shared/types';
import { getServerEnv } from './env';

export interface ApiRequestLike {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}

export interface ApiResponseLike {
  statusCode: number;
  setHeader(name: string, value: string | number | readonly string[]): unknown;
  end(chunk?: string): unknown;
}

export class HttpError extends Error {
  status: number;
  code: string;
  details?: ApiErrorDetail[];

  constructor(status: number, code: string, message: string, details?: ApiErrorDetail[]) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function getHeader(req: ApiRequestLike, name: string): string {
  const val = req.headers[name.toLowerCase()];
  if (Array.isArray(val)) return val[0] ?? '';
  return val ?? '';
}

export function getClientIp(req: ApiRequestLike): string {
  const fwd = getHeader(req, 'x-forwarded-for');
  if (fwd) return fwd.split(',')[0]?.trim() || 'unknown';
  const realIp = getHeader(req, 'x-real-ip');
  if (realIp) return realIp.trim();
  return req.socket?.remoteAddress || 'unknown';
}

export function applyCorsHeaders(req: ApiRequestLike, res: ApiResponseLike): void {
  const env = getServerEnv();
  const origin = getHeader(req, 'origin');
  const allowedOrigins = new Set<string>([
    env.siteUrl.replace(/\/$/, ''),
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]);
  if (process.env.VERCEL_URL) {
    allowedOrigins.add(`https://${process.env.VERCEL_URL}`);
  }
  if (process.env.APP_URL) {
    allowedOrigins.add(process.env.APP_URL.replace(/\/$/, ''));
  }

  if (origin && allowedOrigins.has(origin.replace(/\/$/, ''))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key');
}

export function sendJson<T>(
  res: ApiResponseLike,
  status: number,
  payload: ApiResponse<T>,
): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

export function sendOk<T>(
  res: ApiResponseLike,
  data: T,
  status = 200,
  meta?: ApiMeta,
): void {
  sendJson(res, status, meta ? { ok: true, data, meta } : { ok: true, data });
}

export function sendError(
  res: ApiResponseLike,
  status: number,
  code: string,
  message: string,
  details?: ApiErrorDetail[],
): void {
  sendJson(res, status, {
    ok: false,
    error: details ? { code, message, details } : { code, message },
  });
}

const MAX_BODY_BYTES = 64 * 1024;

export async function readJsonBody(req: ApiRequestLike): Promise<unknown> {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      if (!req.body.trim()) return {};
      try {
        return JSON.parse(req.body);
      } catch {
        throw new HttpError(400, 'INVALID_JSON', 'Request body must be valid JSON.');
      }
    }
    return req.body ?? {};
  }

  const stream = req as unknown as IncomingMessage;
  if (typeof stream.on !== 'function') {
    return {};
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;

    stream.on('data', (chunk: Buffer | string) => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      total += buf.length;
      if (total > MAX_BODY_BYTES) {
        reject(new HttpError(413, 'PAYLOAD_TOO_LARGE', 'Request body exceeds 64KB limit.'));
        stream.destroy();
        return;
      }
      chunks.push(buf);
    });

    stream.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new HttpError(400, 'INVALID_JSON', 'Request body must be valid JSON.'));
      }
    });

    stream.on('error', () => {
      reject(new HttpError(400, 'READ_ERROR', 'Unable to read request body.'));
    });
  });
}

export function getSubPath(req: ApiRequestLike, basePrefix: string): string {
  const rawUrl = req.url || '/';
  const pathname = rawUrl.split('?')[0] || '/';
  if (pathname.startsWith(basePrefix)) {
    const rest = pathname.slice(basePrefix.length);
    return rest.startsWith('/') ? rest : `/${rest}`;
  }
  return pathname;
}

export function getQueryParams(req: ApiRequestLike): URLSearchParams {
  const rawUrl = req.url || '/';
  const qIndex = rawUrl.indexOf('?');
  const params = new URLSearchParams(qIndex >= 0 ? rawUrl.slice(qIndex + 1) : '');
  if (req.query) {
    for (const [key, val] of Object.entries(req.query)) {
      if (val === undefined || key === '__route') continue;
      if (Array.isArray(val)) {
        if (!params.has(key) && val[0]) params.set(key, val[0]);
      } else if (!params.has(key)) {
        params.set(key, val);
      }
    }
  }
  return params;
}

export function withApiHandler(
  handler: (req: ApiRequestLike, res: ApiResponseLike) => Promise<void>,
) {
  return async (
    req: ApiRequestLike | IncomingMessage,
    res: ApiResponseLike | ServerResponse,
  ): Promise<void> => {
    const requestId = crypto.randomUUID();
    res.setHeader('X-Request-Id', requestId);
    applyCorsHeaders(req as ApiRequestLike, res as ApiResponseLike);

    if ((req.method || 'GET').toUpperCase() === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    try {
      await handler(req as ApiRequestLike, res as ApiResponseLike);
    } catch (err) {
      if (err instanceof HttpError) {
        sendError(res as ApiResponseLike, err.status, err.code, err.message, err.details);
        return;
      }

      if (err instanceof ZodError) {
        const details: ApiErrorDetail[] = err.issues.map((issue) => ({
          field: issue.path.join('.') || undefined,
          message: issue.message,
        }));
        sendError(
          res as ApiResponseLike,
          422,
          'VALIDATION_ERROR',
          details[0]?.message || 'Please check the submitted fields.',
          details,
        );
        return;
      }

      console.error(`[API Error ${requestId}]`, err instanceof Error ? err.message : 'Unknown error');
      sendError(
        res as ApiResponseLike,
        500,
        'INTERNAL_ERROR',
        'Something went wrong on our side. Please try again.',
      );
    }
  };
}
