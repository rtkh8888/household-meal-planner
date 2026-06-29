import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';
import { getSupabaseStatus } from '@/lib/supabase/client';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string;
    error?: string;
  }>;
};

function getSafeNextPath(nextPath?: string) {
  return nextPath && nextPath.startsWith('/') ? nextPath : '/dashboard';
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const status = getSupabaseStatus();
  const params = (await searchParams) ?? {};
  const nextPath = getSafeNextPath(params.next);
  const authError = params.error ? decodeURIComponent(params.error) : null;

  if (status.ready) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      redirect(nextPath);
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl items-center gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[2rem] border border-border bg-card p-6 shadow-soft sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Sign in
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight">
            Keep the household moving with one shared meal plan.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            Use email and password for a quick sign-in, or send yourself a magic link if you want
            a lighter login flow. The first authenticated visit will bootstrap the household
            context automatically.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-border bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Flow</p>
              <p className="mt-2 text-sm font-semibold">Login, then context bootstrap</p>
            </div>
            <div className="rounded-3xl border border-border bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Access</p>
              <p className="mt-2 text-sm font-semibold">Protected routes only</p>
            </div>
            <div className="rounded-3xl border border-border bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Fallback</p>
              <p className="mt-2 text-sm font-semibold">Missing profile gets repaired</p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-dashed border-border bg-muted/40 p-4 text-sm">
            <p className="font-semibold">Supabase status</p>
            <p className="mt-1 text-muted-foreground">
              {status.ready
                ? 'Connected variables are configured.'
                : `Missing: ${status.missing.join(', ')}.`}
            </p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-border bg-[rgba(255,255,255,0.92)] p-6 shadow-soft sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Auth
          </p>
          <h2 className="mt-3 text-2xl font-semibold">Welcome back</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Use the same email address you used to sign up. If you prefer not to type a password,
            send a magic link instead.
          </p>

          {authError ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              {authError}
            </div>
          ) : null}

          <div className="mt-6">
            <LoginForm nextPath={nextPath} />
          </div>

          <p className="mt-6 text-xs leading-5 text-muted-foreground">
            When auth succeeds, the app will create any missing household and profile rows before
            you reach the dashboard.
          </p>
        </section>
      </div>
    </main>
  );
}
