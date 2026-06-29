import { AppShell } from '@/components/layout/app-shell';
import { DishLibrary } from '@/components/dishes/dish-library';

export default function DishesPage() {
  return (
    <AppShell
      title="Dishes"
      description="Build your household recipe library with grocery, pantry, and optional ingredient tracking."
    >
      <DishLibrary />
    </AppShell>
  );
}
