import { AppShell } from '@/components/layout/app-shell';
import { PageSection } from '@/components/layout/page-section';

const groceryItems = ['Pork', 'Broccoli', 'Rice'];

export default function GroceryPage() {
  return (
    <AppShell
      title="Grocery List"
      description="Generate a checklist from cooked meals only, while ignoring pantry staples."
    >
      <PageSection eyebrow="Checklist" title="Grocery list placeholder">
        <div className="space-y-3">
          {groceryItems.map((item) => (
            <label
              key={item}
              className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3"
            >
              <input type="checkbox" className="h-4 w-4 rounded border-border" />
              <span className="text-sm font-medium">{item}</span>
            </label>
          ))}
        </div>
      </PageSection>
    </AppShell>
  );
}

