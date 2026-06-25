import { createClient } from '@supabase/supabase-js';
import { assertSupabaseEnv, getSupabaseEnv } from '@/lib/env';

export function createSupabaseBrowserClient() {
  const { url, anonKey } = assertSupabaseEnv();
  return createClient(url, anonKey);
}

export function getSupabaseStatus() {
  const { missing } = getSupabaseEnv();
  return {
    ready: missing.length === 0,
    missing
  };
}

