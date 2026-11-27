import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || '';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || '';

export const ENABLE_GOOGLE_AUTH =
  (import.meta.env.VITE_ENABLE_GOOGLE_AUTH as string | undefined)?.toLowerCase() === 'true';

export const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.trim() ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return clientInstance;
}
