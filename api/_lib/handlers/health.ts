import type { HealthDTO } from '../../../shared/types';
import { getServerEnv } from '../env';
import { HttpError, sendOk, withApiHandler } from '../http';
import { createServiceSupabase } from '../supabase';

export const healthHandler = withApiHandler(async (req, res) => {
  if ((req.method || 'GET').toUpperCase() !== 'GET') {
    throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Use GET for /api/health.');
  }

  const env = getServerEnv();
  let dbReachable = false;

  if (env.supabaseConfigured) {
    try {
      const client = createServiceSupabase();
      const { error } = await client
        .from('shipping_zones')
        .select('code', { count: 'exact', head: true });
      dbReachable = !error;
    } catch {
      dbReachable = false;
    }
  }

  const payload: HealthDTO = {
    api: true,
    mode: env.supabaseConfigured ? 'connected' : 'demo',
    supabaseConfigured: env.supabaseConfigured,
    dbReachable,
    timestamp: new Date().toISOString(),
  };

  sendOk(res, payload);
});
