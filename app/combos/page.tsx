import { AppShell } from '@/components/layout/app-shell';
import { ComboLibrary } from '@/components/combos/combo-library';

export default function CombosPage() {
  return (
    <AppShell
      title="Meal Combos"
      description="Group dishes into reusable combos like dinner for two, lunch leftovers, or batch-cook packs."
    >
      <ComboLibrary />
    </AppShell>
  );
}
