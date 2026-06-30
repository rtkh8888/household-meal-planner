import { AppShell } from '@/components/layout/app-shell';

export default function DashboardLoading() {
  return (
    <AppShell
      title="Dashboard"
      description="A calm home base for your household meal library, weekly plan, leftovers, and grocery flow."
    >
      <div className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[1.75rem] border border-border bg-white p-5 shadow-soft">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="mt-4 h-8 w-3/4 rounded bg-muted" />
            <div className="mt-3 h-5 w-full rounded bg-muted" />
            <div className="mt-2 h-5 w-5/6 rounded bg-muted" />
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-3xl border border-border bg-muted/20 p-4">
                  <div className="h-4 w-16 rounded bg-muted" />
                  <div className="mt-3 h-8 w-12 rounded bg-muted" />
                  <div className="mt-3 h-4 w-full rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[1.75rem] border border-border bg-white/80 p-5">
            <div className="h-4 w-28 rounded bg-muted" />
            <div className="mt-4 h-7 w-2/3 rounded bg-muted" />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-24 rounded-3xl bg-muted" />
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="rounded-[1.75rem] border border-border bg-white/80 p-5">
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="mt-4 h-7 w-1/2 rounded bg-muted" />
              <div className="mt-5 space-y-3">
                {Array.from({ length: 2 }).map((__, cardIndex) => (
                  <div key={cardIndex} className="h-28 rounded-3xl bg-muted" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
