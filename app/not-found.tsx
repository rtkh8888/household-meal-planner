import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md rounded-3xl border border-border bg-card p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          404
        </p>
        <h1 className="mt-3 text-2xl font-semibold">That page does not exist.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          The route may be missing or the app shell may still be under construction.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}

