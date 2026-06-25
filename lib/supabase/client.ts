import { createClient } from '@supabase/supabase-js';
import { assertSupabaseEnv, getSupabaseEnv } from '@/lib/env';
import type { Database } from '@/types/database';

export function createSupabaseBrowserClient() {
  const { url, anonKey } = assertSupabaseEnv();
  return createClient<Database>(url, anonKey);
}

export function getSupabaseStatus() {
  const { missing } = getSupabaseEnv();
  return {
    ready: missing.length === 0,
    missing
  };
}
