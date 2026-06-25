'use client';

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md rounded-3xl border border-border bg-card p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-danger">
          Something went wrong
        </p>
        <h1 className="mt-3 text-2xl font-semibold">We could not load this screen.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{error.message}</p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

