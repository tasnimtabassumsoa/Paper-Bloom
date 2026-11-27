import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function main() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.log('Supabase server credentials (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are not set.');
    console.log('The app will run in Demo Mode until you configure .env.');
    process.exit(0);
  }

  const client = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { count: prodCount, error: prodErr } = await client
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  if (prodErr) {
    console.error('Database check failed:', prodErr.message);
    process.exit(1);
  }

  const { count: zoneCount } = await client
    .from('shipping_zones')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  console.log(`Connected to Supabase. Active products: ${prodCount ?? 0}, Shipping zones: ${zoneCount ?? 0}.`);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
