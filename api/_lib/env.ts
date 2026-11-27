import { z } from 'zod';

const serverEnvSchema = z.object({
  SUPABASE_URL: z.string().url().optional().or(z.literal('')),
  SUPABASE_ANON_KEY: z.string().min(20).optional().or(z.literal('')),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional().or(z.literal('')),
  SITE_URL: z.string().url().optional().or(z.literal('')),
  APP_URL: z.string().url().optional().or(z.literal('')),
});

export interface ServerEnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  siteUrl: string;
  supabaseConfigured: boolean;
}

let cachedEnv: ServerEnvConfig | null = null;

export function getServerEnv(): ServerEnvConfig {
  if (cachedEnv) return cachedEnv;

  const parsed = serverEnvSchema.safeParse({
    SUPABASE_URL: process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    SITE_URL: process.env.SITE_URL ?? process.env.VITE_SITE_URL ?? '',
    APP_URL: process.env.APP_URL ?? '',
  });

  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    console.warn(`[Paper Bloom env warning] ${issues}`);
  }

  const data = parsed.success ? parsed.data : {};
  const supabaseUrl = (data.SUPABASE_URL || '').trim();
  const supabaseAnonKey = (data.SUPABASE_ANON_KEY || '').trim();
  const supabaseServiceRoleKey = (data.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const siteUrl = (data.SITE_URL || data.APP_URL || 'http://localhost:3000').trim();

  const supabaseConfigured = Boolean(
    supabaseUrl && supabaseAnonKey && supabaseServiceRoleKey,
  );

  cachedEnv = {
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
    siteUrl,
    supabaseConfigured,
  };
  return cachedEnv;
}

export function resetServerEnvCacheForTests(): void {
  cachedEnv = null;
}
