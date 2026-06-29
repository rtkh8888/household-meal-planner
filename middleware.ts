import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { assertSupabaseEnv, getSupabaseStatus } from '@/lib/env';
import { ensureHouseholdContext } from '@/lib/household';
import type { Database } from '@/types/database';

const PUBLIC_PATHS = ['/login', '/auth/callback'];

function getSafeNextPath(nextPath: string | null) {
  return nextPath && nextPath.startsWith('/') ? nextPath : '/dashboard';
}

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const response = NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });

  if (!getSupabaseStatus().ready) {
    return response;
  }

  const { url, anonKey } = assertSupabaseEnv();
  const cookiesToSet: CookieToSet[] = [];

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

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublicPath = PUBLIC_PATHS.some(
    (publicPath) => path === publicPath || path.startsWith(`${publicPath}/`)
  );

  if (!user && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', `${path}${request.nextUrl.search}`);
    const redirectResponse = NextResponse.redirect(loginUrl);
    cookiesToSet.forEach(({ name, value, options }) => redirectResponse.cookies.set(name, value, options));
    return redirectResponse;
  }

  if (user && path === '/login') {
    const redirectUrl = new URL(getSafeNextPath(request.nextUrl.searchParams.get('next')), request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    cookiesToSet.forEach(({ name, value, options }) => redirectResponse.cookies.set(name, value, options));
    return redirectResponse;
  }

  if (user && !isPublicPath) {
    await ensureHouseholdContext(supabase, user);
  }

  cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.svg|manifest.webmanifest).*)']
};
