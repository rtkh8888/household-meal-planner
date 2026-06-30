import { AppShell } from '@/components/layout/app-shell';
import { GroceryBoard } from '@/components/grocery/grocery-board';

export default function GroceryPage() {
  return (
    <AppShell
      title="Grocery List"
      description="Generate a checklist from cooked meals only, keep manual additions, and track pantry staples separately."
    >
      <GroceryBoard />
    </AppShell>
  );
}
