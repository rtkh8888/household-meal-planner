import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { assertSupabaseEnv, getSupabaseStatus } from '@/lib/env';
import type { Database } from '@/types/database';

function getSafeNextPath(nextPath: string | null) {
  return nextPath && nextPath.startsWith('/') ? nextPath : '/dashboard';
}

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export async function GET(request: NextRequest) {
  if (!getSupabaseStatus().ready) {
    return NextResponse.redirect(new URL('/login?error=Missing%20Supabase%20environment%20variables.', request.url));
  }

  const { url, anonKey } = assertSupabaseEnv();
  const authCode = request.nextUrl.searchParams.get('code');
  const nextPath = getSafeNextPath(request.nextUrl.searchParams.get('next'));
  const cookiesToSet: CookieToSet[] = [];

  if (!authCode) {
    return NextResponse.redirect(new URL('/login?error=Missing%20authentication%20code.', request.url));
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies) {
        cookiesToSet.push(...cookies);
      }
    }
  });

  const { error } = await supabase.auth.exchangeCodeForSession(authCode);

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url));
  cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  return response;
}
