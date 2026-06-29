import { createBrowserClient } from '@supabase/ssr';
import { assertSupabaseEnv, getSupabaseStatus } from '@/lib/env';
import type { Database } from '@/types/database';

export function createSupabaseBrowserClient() {
  const { url, anonKey } = assertSupabaseEnv();
  return createBrowserClient<Database>(url, anonKey);
}

export { getSupabaseStatus };
