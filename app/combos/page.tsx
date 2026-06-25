import { AppShell } from '@/components/layout/app-shell';
import { PageSection } from '@/components/layout/page-section';

export default function CombosPage() {
  return (
    <AppShell
      title="Meal Combos"
      description="Group dishes into reusable combos like dinner for two, lunch leftovers, or batch-cook packs."
    >
      <PageSection eyebrow="Builder" title="Meal combo placeholder">
        <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
          This phase establishes the route and layout only. Combo assembly and persistence come
          later.
        </div>
      </PageSection>
    </AppShell>
  );
}

