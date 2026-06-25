import { AppShell } from '@/components/layout/app-shell';
import { PageSection } from '@/components/layout/page-section';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function PlannerPage() {
  return (
    <AppShell
      title="Planner"
      description="Plan cook batches and leftover meals on a simple weekly board."
    >
      <PageSection eyebrow="Week view" title="Weekly planner placeholder">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
          {days.map((day) => (
            <div key={day} className="rounded-2xl border border-border bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {day}
              </p>
              <p className="mt-6 text-sm text-muted-foreground">Empty slot</p>
            </div>
          ))}
        </div>
      </PageSection>
    </AppShell>
  );
}

