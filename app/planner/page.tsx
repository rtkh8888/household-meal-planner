import { AppShell } from '@/components/layout/app-shell';
import { PlannerBoard } from '@/components/planner/planner-board';

export default function PlannerPage() {
  return (
    <AppShell
      title="Planner"
      description="Plan cook batches and leftover meals on a simple weekly board."
    >
      <PlannerBoard />
    </AppShell>
  );
}
