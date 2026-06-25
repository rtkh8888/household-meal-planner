import { AppShell } from '@/components/layout/app-shell';
import { PageSection } from '@/components/layout/page-section';

const sampleDishes = ['Stir fry pork', 'Boiled broccoli', 'Garlic rice'];

export default function DishesPage() {
  return (
    <AppShell
      title="Dishes"
      description="Store recipes and track ingredients, including pantry-staple flags for grocery math later."
    >
      <PageSection eyebrow="Library" title="Dish placeholders">
        <div className="grid gap-3 sm:grid-cols-2">
          {sampleDishes.map((dish) => (
            <article key={dish} className="rounded-2xl border border-border bg-white p-4">
              <h3 className="font-semibold">{dish}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Ingredient list, staple flags, and edit actions will live here in Phase 2.
              </p>
            </article>
          ))}
        </div>
      </PageSection>
    </AppShell>
  );
}

