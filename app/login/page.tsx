import Link from 'next/link';
import { getSupabaseStatus } from '@/lib/supabase/client';

export default function LoginPage() {
  const status = getSupabaseStatus();

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center">
        <div className="rounded-[2rem] border border-border bg-card p-6 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Sign in
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Welcome back</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            This is the placeholder login screen for the household meal planner MVP.
          </p>

          <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/50 p-4 text-sm">
            <p className="font-semibold">Supabase status</p>
            <p className="mt-1 text-muted-foreground">
              {status.ready
                ? 'Connected variables are configured.'
                : `Missing: ${status.missing.join(', ')}.`}
            </p>
          </div>

          <button
            type="button"
            className="mt-6 w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
          >
            Continue with email
          </button>

          <Link
            href="/dashboard"
            className="mt-3 block text-center text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
          >
            Skip to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

