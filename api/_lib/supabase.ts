import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getServerEnv } from './env';
import { getHeader, HttpError, type ApiRequestLike } from './http';

export interface VerifiedUser {
  userId: string;
  email: string | null;
  isGuest: boolean;
  accessToken: string;
}

export function createServiceSupabase(): SupabaseClient {
  const env = getServerEnv();
  if (!env.supabaseConfigured) {
    throw new HttpError(
      503,
      'SUPABASE_NOT_CONFIGURED',
      'Database credentials are not configured on the server.',
    );
  }
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createUserSupabase(accessToken: string): SupabaseClient {
  const env = getServerEnv();
  if (!env.supabaseConfigured) {
    throw new HttpError(
      503,
      'SUPABASE_NOT_CONFIGURED',
      'Database credentials are not configured on the server.',
    );
  }
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

export async function requireAuth(req: ApiRequestLike): Promise<VerifiedUser> {
  const env = getServerEnv();
  if (!env.supabaseConfigured) {
    throw new HttpError(
      503,
      'DEMO_MODE_ONLY',
      'Server-side accounts require Supabase credentials. Demo Mode manages carts in your browser.',
    );
  }

  const authHeader = getHeader(req, 'authorization');
  if (!authHeader.startsWith('Bearer ')) {
    throw new HttpError(401, 'UNAUTHORIZED', 'Sign in or continue as guest to access your bag.');
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    throw new HttpError(401, 'UNAUTHORIZED', 'Missing authentication token.');
  }

  const service = createServiceSupabase();
  const { data, error } = await service.auth.getUser(token);
  if (error || !data.user) {
    throw new HttpError(401, 'INVALID_TOKEN', 'Your session has expired. Please sign in again.');
  }

  const isGuest = Boolean(
    (data.user as unknown as { is_anonymous?: boolean }).is_anonymous,
  );

  return {
    userId: data.user.id,
    email: data.user.email ?? null,
    isGuest,
    accessToken: token,
  };
}
