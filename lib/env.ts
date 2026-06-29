type SupabaseEnv = {
  url: string;
  anonKey: string;
  appUrl: string;
  missing: string[];
};

export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, '') ?? '';
  const missing = [
    !url ? 'NEXT_PUBLIC_SUPABASE_URL' : null,
    !anonKey ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : null
  ].filter(Boolean) as string[];

  return { url, anonKey, appUrl, missing };
}

export function getSupabaseStatus() {
  const { missing } = getSupabaseEnv();
  return {
    ready: missing.length === 0,
    missing
  };
}

export function assertSupabaseEnv() {
  const env = getSupabaseEnv();

  if (env.missing.length > 0) {
    throw new Error(
      `Missing environment variables: ${env.missing.join(', ')}. Copy .env.local.example to .env.local and fill in your Supabase project values.`
    );
  }

  return env;
}
