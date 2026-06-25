import { AppShell } from '@/components/layout/app-shell';
import { PageSection } from '@/components/layout/page-section';

const stats = [
  { label: 'Dishes', value: '0', hint: 'Recipe library placeholder' },
  { label: 'Combos', value: '0', hint: 'Reusable meal bundles' },
  { label: 'Planned meals', value: '0', hint: 'This week' },
  { label: 'Groceries', value: '0', hint: 'From cooked meals only' }
];

export default function DashboardPage() {
  return (
    <AppShell
      title="Dashboard"
      description="A calm home base for dishes, meal combos, weekly planning, leftovers, and grocery lists."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-3xl border border-border bg-white p-4">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold">{stat.value}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {stat.hint}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <PageSection eyebrow="Next up" title="Start with the dish library">
          <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
            <li>Create a few dishes and mark pantry staples.</li>
            <li>Bundle dishes into reusable meal combos.</li>
            <li>Plan a week, then assign leftovers from cook batches.</li>
          </ul>
        </PageSection>

        <PageSection eyebrow="MVP scope" title="What this phase sets up">
          <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
            <li>Mobile-first shell and navigation.</li>
            <li>Supabase client and env guard.</li>
            <li>Placeholder routes for the main workflows.</li>
          </ul>
        </PageSection>
      </div>
    </AppShell>
  );
}

