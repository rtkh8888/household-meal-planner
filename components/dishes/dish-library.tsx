'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ToastMessage } from '@/components/ui/toast-message';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type DishRow = Database['public']['Tables']['dishes']['Row'];
type DishInsert = Database['public']['Tables']['dishes']['Insert'];
type DishUpdate = Database['public']['Tables']['dishes']['Update'];
type DishIngredientRow = Database['public']['Tables']['dish_ingredients']['Row'];
type DishIngredientInsert = Database['public']['Tables']['dish_ingredients']['Insert'];

type IngredientType = 'grocery' | 'pantry' | 'optional';
type DishCategory = 'protein' | 'vegetable' | 'carb' | 'soup' | 'side' | 'one_pot' | 'breakfast' | 'snack' | 'other';
type FilterCategory = DishCategory | 'all';

type DishWithIngredients = DishRow & { ingredients: DishIngredientRow[] };
type IngredientDraft = { id: string; name: string; ingredientType: IngredientType };
type FormState = { id: string | null; name: string; category: DishCategory | ''; instructions: string; notes: string; ingredients: IngredientDraft[] };

type SaveState = 'idle' | 'saving';

const CATEGORY_OPTIONS: Array<{ value: DishCategory; label: string }> = [
  { value: 'protein', label: 'Protein' },
  { value: 'vegetable', label: 'Vegetable' },
  { value: 'carb', label: 'Carb' },
  { value: 'soup', label: 'Soup' },
  { value: 'side', label: 'Side' },
  { value: 'one_pot', label: 'One pot' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'snack', label: 'Snack' },
  { value: 'other', label: 'Other' }
];

const PANTRY_STAPLES = ['Soy sauce', 'Oyster sauce', 'Oil', 'Salt', 'Pepper', 'Sugar', 'Sesame oil', 'Cornstarch', 'Vinegar', 'Garlic powder'] as const;
const TYPE_LABELS: Record<IngredientType, string> = { grocery: 'Grocery', pantry: 'Pantry', optional: 'Optional' };
const TYPE_STYLES: Record<IngredientType, { card: string; active: string; pill: string }> = {
  grocery: { card: 'bg-secondary/14 border-secondary/24', active: 'bg-secondary/22 border-secondary/35 text-secondary-foreground', pill: 'bg-secondary/18 text-secondary-foreground' },
  pantry: { card: 'bg-muted border-border', active: 'bg-muted border-primary/18 text-foreground', pill: 'bg-muted text-muted-foreground' },
  optional: { card: 'bg-white border-border', active: 'bg-secondary/14 border-secondary/24 text-secondary-foreground', pill: 'bg-white text-muted-foreground' }
};

const PREVIEW_INGREDIENT_PILL = 'rounded-full border border-[#C9E5BC] bg-[#EAF6E2] px-3 py-2 text-xs font-semibold text-[#2F6F22]';
const TOTAL_COUNT_PILL = 'rounded-full border border-[#E5E7EB] bg-[#F3F4F6] px-3 py-1 text-xs font-semibold text-[#374151]';
const MORE_PILL = 'rounded-full border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-medium text-[#6B7280]';

function createIngredientDraft(overrides?: Partial<IngredientDraft>): IngredientDraft {
  return { id: crypto.randomUUID(), name: '', ingredientType: 'grocery', ...overrides };
}

function createEmptyFormState(): FormState {
  return { id: null, name: '', category: '', instructions: '', notes: '', ingredients: [] };
}

function toFormState(dish: DishWithIngredients): FormState {
  return {
    id: dish.id,
    name: dish.name,
    category: (dish.category as DishCategory | null) ?? '',
    instructions: dish.instructions ?? '',
    notes: dish.notes ?? '',
    ingredients: dish.ingredients.map((ingredient) =>
      createIngredientDraft({ id: ingredient.id, name: ingredient.name, ingredientType: ingredient.ingredient_type as IngredientType })
    )
  };
}

function normalizeIngredientName(name: string) {
  return name.trim().replace(/\s+/g, ' ');
}

function parseBulkIngredients(value: string) {
  const seen = new Set<string>();
  return value
    .split(/\r?\n/)
    .map(normalizeIngredientName)
    .filter(Boolean)
    .filter((line) => {
      const key = line.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function getCategoryOption(category: DishCategory | null) {
  return CATEGORY_OPTIONS.find((option) => option.value === category) ?? null;
}

function IngredientTypePill({ type, active, onClick }: { type: IngredientType; active: boolean; onClick: () => void }) {
  const style = TYPE_STYLES[type];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${active ? style.active : 'border-border bg-white text-muted-foreground hover:border-primary/35 hover:text-foreground'}`}
    >
      {TYPE_LABELS[type]}
    </button>
  );
}

export function DishLibrary() {
  const [dishes, setDishes] = useState<DishWithIngredients[]>([]);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('all');
  const [formState, setFormState] = useState<FormState>(createEmptyFormState());
  const [bulkIngredientsText, setBulkIngredientsText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [expandedDishIds, setExpandedDishIds] = useState<Set<string>>(() => new Set());

  useEffect(() => { void loadDishes(); }, []);

  const filteredDishes = useMemo(() => {
    const query = search.trim().toLowerCase();
    return dishes.filter((dish) => {
      const matchesSearch =
        query.length === 0 ||
        dish.name.toLowerCase().includes(query) ||
        dish.ingredients.some((ingredient) => ingredient.name.toLowerCase().includes(query));
      const matchesCategory = categoryFilter === 'all' || dish.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [categoryFilter, dishes, search]);

  async function loadDishes() {
    setIsLoading(true);
    setLoadError(null);
    const supabase = createSupabaseBrowserClient();
    const { data: profile, error: profileError } = await supabase.from('profiles').select('household_id').single();
    if (profileError || !profile) {
      setLoadError(profileError?.message ?? 'Household profile could not be loaded.');
      setIsLoading(false);
      return;
    }
    setHouseholdId(profile.household_id);

    const { data: dishData, error: dishError } = await supabase.from('dishes').select('*').order('updated_at', { ascending: false });
    if (dishError) {
      setLoadError(dishError.message);
      setIsLoading(false);
      return;
    }

    const dishIds = (dishData ?? []).map((dish) => dish.id);
    let ingredientRows: DishIngredientRow[] = [];
    if (dishIds.length > 0) {
      const { data: ingredientData, error: ingredientError } = await supabase.from('dish_ingredients').select('*').in('dish_id', dishIds).order('sort_order', { ascending: true });
      if (ingredientError) {
        setLoadError(ingredientError.message);
        setIsLoading(false);
        return;
      }
      ingredientRows = ingredientData ?? [];
    }

    const ingredientsByDishId = new Map<string, DishIngredientRow[]>();
    ingredientRows.forEach((ingredient) => {
      const list = ingredientsByDishId.get(ingredient.dish_id) ?? [];
      list.push(ingredient);
      ingredientsByDishId.set(ingredient.dish_id, list);
    });

    setDishes((dishData ?? []).map((dish) => ({ ...dish, ingredients: ingredientsByDishId.get(dish.id) ?? [] })));
    setIsLoading(false);
  }

  function resetForm() {
    setFormState(createEmptyFormState());
    setBulkIngredientsText('');
    setFormError(null);
    setFormMessage(null);
  }

  function startNewDish() {
    resetForm();
    setIsEditorOpen(true);
  }

  function openEditForm(dish: DishWithIngredients) {
    setFormState(toFormState(dish));
    setBulkIngredientsText('');
    setFormError(null);
    setFormMessage(null);
    setIsEditorOpen(true);
  }

  function closeEditor() {
    setIsEditorOpen(false);
  }

  function updateIngredient(ingredientId: string, key: 'name' | 'ingredientType', value: string) {
    setFormState((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredient) => (ingredient.id === ingredientId ? { ...ingredient, [key]: value } : ingredient))
    }));
  }

  function addIngredientRow() {
    setFormError(null);
    setFormState((current) => ({ ...current, ingredients: [...current.ingredients, createIngredientDraft()] }));
  }

  function removeIngredientRow(ingredientId: string) {
    setFormState((current) => ({ ...current, ingredients: current.ingredients.filter((ingredient) => ingredient.id !== ingredientId) }));
    setFormError(null);
  }

  function toggleExpandedDish(dishId: string) {
    setExpandedDishIds((current) => {
      const next = new Set(current);
      if (next.has(dishId)) {
        next.delete(dishId);
      } else {
        next.add(dishId);
      }
      return next;
    });
  }
  function addBulkIngredients() {
    const parsed = parseBulkIngredients(bulkIngredientsText);
    if (parsed.length === 0) {
      setFormError('Paste ingredients line by line before converting.');
      return;
    }

    setFormState((current) => {
      const next = [...current.ingredients];
      const existing = new Set(current.ingredients.map((ingredient) => ingredient.name.toLowerCase()));
      let added = 0;
      parsed.forEach((name) => {
        const key = name.toLowerCase();
        if (existing.has(key)) return;
        existing.add(key);
        next.push(createIngredientDraft({ name }));
        added += 1;
      });
      if (added === 0) setFormError('Those ingredients are already on the list.');
      else {
        setFormError(null);
        setFormMessage(`${added} ingredient${added === 1 ? '' : 's'} added.`);
      }
      return { ...current, ingredients: next };
    });

    setBulkIngredientsText('');
  }

  function addPantryStaple(name: string) {
    const normalized = normalizeIngredientName(name).toLowerCase();
    if (formState.ingredients.some((ingredient) => ingredient.name.toLowerCase() === normalized)) {
      setFormError(`“${name}” is already in this dish.`);
      return;
    }
    setFormError(null);
    setFormState((current) => ({
      ...current,
      ingredients: [...current.ingredients, createIngredientDraft({ name, ingredientType: 'pantry' })]
    }));
  }

  async function handleSaveDish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = formState.name.trim();
    const ingredients = formState.ingredients
      .map((ingredient, index) => ({ name: normalizeIngredientName(ingredient.name), ingredientType: ingredient.ingredientType, sortOrder: index }))
      .filter((ingredient) => ingredient.name.length > 0);

    if (!name) {
      setFormError('Dish name is required.');
      return;
    }
    if (!householdId) {
      setFormError('Household context is missing. Refresh the page and try again.');
      return;
    }

    setSaveState('saving');
    setFormError(null);
    setFormMessage(null);
    const supabase = createSupabaseBrowserClient();
    let dishId = formState.id;
    const payload: DishUpdate = {
      name,
      category: formState.category || null,
      instructions: formState.instructions.trim() || null,
      notes: formState.notes.trim() || null
    };

    if (dishId) {
      const { error: updateError } = await supabase.from('dishes').update(payload).eq('id', dishId);
      if (updateError) { setFormError(updateError.message); setSaveState('idle'); return; }
      const { error: deleteIngredientsError } = await supabase.from('dish_ingredients').delete().eq('dish_id', dishId);
      if (deleteIngredientsError) { setFormError(deleteIngredientsError.message); setSaveState('idle'); return; }
    } else {
      const insertPayload: DishInsert = { household_id: householdId, name, category: formState.category || null, instructions: formState.instructions.trim() || null, notes: formState.notes.trim() || null };
      const { data: createdDish, error: createError } = await supabase.from('dishes').insert(insertPayload).select('id').single();
      if (createError || !createdDish) { setFormError(createError?.message ?? 'Dish could not be created.'); setSaveState('idle'); return; }
      dishId = createdDish.id;
    }

    if (ingredients.length > 0) {
      const insertIngredients: DishIngredientInsert[] = ingredients.map((ingredient) => ({ dish_id: dishId, name: ingredient.name, ingredient_type: ingredient.ingredientType, sort_order: ingredient.sortOrder }));
      const { error: ingredientInsertError } = await supabase.from('dish_ingredients').insert(insertIngredients);
      if (ingredientInsertError) { setFormError(ingredientInsertError.message); setSaveState('idle'); return; }
    }

    setSaveState('idle');
    resetForm();
    setIsEditorOpen(false);
    setFormMessage(formState.id ? 'Dish updated.' : 'Dish created.');
    await loadDishes();
  }

  async function handleDeleteDish(dish: DishWithIngredients) {
    if (!window.confirm(`Delete "${dish.name}"? This will remove its ingredients too.`)) return;
    setPendingDeleteId(dish.id);
    setLoadError(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from('dishes').delete().eq('id', dish.id);
    setPendingDeleteId(null);
    if (error) { setLoadError(error.message); return; }
    setFormMessage('Dish deleted.');
    await loadDishes();
  }

  return (
    <div className="space-y-4">
      <section className="space-y-4">
        <div className="space-y-4">
          <div className="rounded-[1.75rem] border border-border bg-white/92 p-5 shadow-[0_10px_30px_rgba(90,60,70,0.06)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Library</p>
                <h2 className="mt-2 text-lg font-semibold text-foreground">Search and shape your dish library</h2>
              </div>
              <button type="button" onClick={startNewDish} className="rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5">New dish</button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
              <label className="block text-sm"><span className="mb-1 block font-medium text-foreground">Search</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search dishes or ingredients" className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary" /></label>
              <label className="block text-sm"><span className="mb-1 block font-medium text-foreground">Category</span><select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as FilterCategory)} className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"><option value="all">All categories</option>{CATEGORY_OPTIONS.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}</select></label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className={TOTAL_COUNT_PILL}>{dishes.length} dishes total</span>
              <span className={TOTAL_COUNT_PILL}>{filteredDishes.length} showing</span>
              
            </div>

            {loadError ? <p className="mt-4 text-sm text-danger">{loadError}</p> : null}
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="rounded-[1.75rem] border border-border bg-white p-5"><div className="h-4 w-24 rounded bg-muted" /><div className="mt-4 h-7 w-2/3 rounded bg-muted" /><div className="mt-4 h-16 rounded bg-muted" /></div>)}</div>
          ) : filteredDishes.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-border bg-white/86 p-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Empty state</p>
              <h3 className="mt-3 text-2xl font-semibold text-foreground">{dishes.length === 0 ? 'No dishes yet' : 'No dishes match this filter'}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{dishes.length === 0 ? 'Create your first dish to start building meal combos and future grocery lists.' : 'Try a different search term or category, or clear the filters to see everything again.'}</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">{dishes.length === 0 ? <button type="button" onClick={startNewDish} className="rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">Create first dish</button> : <button type="button" onClick={() => { setSearch(''); setCategoryFilter('all'); }} className="rounded-full border border-border bg-white px-4 py-3 text-sm font-semibold text-foreground">Clear filters</button>}</div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredDishes.map((dish) => {
                const category = getCategoryOption(dish.category as DishCategory | null);
                const previewIngredients = dish.ingredients.slice(0, 3);
                return (
                  <article key={dish.id} className="relative overflow-hidden rounded-[1.75rem] border border-border bg-white p-5 shadow-[0_10px_30px_rgba(90,60,70,0.06)]">
                    <div className="relative flex items-start justify-between gap-3">
                      <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{category?.label ?? 'Uncategorized'}</p><h3 className="mt-2 text-xl font-semibold text-foreground">{dish.name}</h3></div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => openEditForm(dish)} className="rounded-full border border-[#F5B83D] bg-[#FFF7E0] px-3 py-2 text-sm font-semibold text-[#8A5A00] transition hover:-translate-y-0.5">Edit</button>
                        <button type="button" onClick={() => handleDeleteDish(dish)} disabled={pendingDeleteId === dish.id} className="rounded-full border border-[#E85D5D] bg-[#FFF0F0] px-3 py-2 text-sm font-semibold text-[#B42323] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">{pendingDeleteId === dish.id ? 'Deleting...' : 'Delete'}</button>
                      </div>
                    </div>
                    <div className="relative mt-4 flex flex-wrap gap-2"><span className={TOTAL_COUNT_PILL}>{dish.ingredients.length} ingredients</span></div>
                    <div className="relative mt-4 flex flex-wrap gap-2">
                      {previewIngredients.length > 0 ? (
                        previewIngredients.map((ingredient) => {
                          return (
                            <span key={ingredient.id} className={PREVIEW_INGREDIENT_PILL}>
                              {ingredient.name}
                            </span>
                          );
                        })
                      ) : (
                        <span className={PREVIEW_INGREDIENT_PILL}>
                          No ingredients yet
                        </span>
                      )}
                    </div>
                    {expandedDishIds.has(dish.id) && dish.ingredients.length > 3 ? (
                      <div className="relative mt-3 flex flex-wrap gap-2">
                        {dish.ingredients.slice(3).map((ingredient) => {
                          return (
                            <span key={ingredient.id} className={PREVIEW_INGREDIENT_PILL}>
                              {ingredient.name}
                            </span>
                          );
                        })}
                      </div>
                    ) : null}
                    {dish.ingredients.length > 3 ? (
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => toggleExpandedDish(dish.id)}
                          className={MORE_PILL}
                        >
                          {expandedDishIds.has(dish.id) ? 'Show less' : `+${dish.ingredients.length - 3} more`}
                        </button>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {isEditorOpen ? (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-black/35 px-4 py-6 backdrop-blur-sm" onClick={(event) => { if (event.target === event.currentTarget) closeEditor(); }}>
          <div className="mx-auto max-w-4xl rounded-[2rem] border border-border bg-[rgba(255,255,255,0.98)] p-5 shadow-[0_14px_40px_rgba(90,60,70,0.12)] sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Editor</p>
                <h2 className="mt-2 text-lg font-semibold text-foreground">{formState.id ? 'Edit dish' : 'Create a new dish'}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Bulk input first, then adjust the chips if you need to fine-tune types.</p>
              </div>
              <button type="button" onClick={closeEditor} className="rounded-full border border-[#E85D5D] bg-[#FFF0F0] px-4 py-2 text-sm font-semibold text-[#B42323] transition hover:-translate-y-0.5">Close</button>
            </div>

            <form onSubmit={handleSaveDish} className="mt-5 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm"><span className="mb-1 block font-medium text-foreground">Dish name</span><input value={formState.name} onChange={(e) => setFormState((current) => ({ ...current, name: e.target.value }))} className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary" placeholder="Stir fry pork" /></label>
                <label className="block text-sm"><span className="mb-1 block font-medium text-foreground">Category</span><select value={formState.category} onChange={(e) => setFormState((current) => ({ ...current, category: e.target.value as DishCategory | '' }))} className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"><option value="">No category yet</option>{CATEGORY_OPTIONS.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}</select></label>
              </div>

              <div className="rounded-[1.6rem] border border-border bg-muted/18 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div><p className="text-sm font-semibold text-foreground">Ingredients</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Paste one ingredient per line, then convert them into chips.</p></div>
                  <button type="button" onClick={addBulkIngredients} className="rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5">Convert to ingredients</button>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                  <label className="block text-sm"><span className="mb-1 block font-medium text-foreground">Bulk ingredient input</span><textarea value={bulkIngredientsText} onChange={(e) => setBulkIngredientsText(e.target.value)} rows={7} placeholder={`Add ingredients, one per line...\n\nExample:\nPork\nGarlic\nBroccoli\nSoy sauce\nOyster sauce`} className="w-full rounded-[1.4rem] border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary" /><p className="mt-2 text-xs leading-5 text-muted-foreground">Grocery is the default type when you convert lines into ingredient chips.</p></label>
                  <div className="rounded-[1.4rem] border border-border bg-white p-4"><p className="text-sm font-semibold text-foreground">Common pantry staples</p><div className="mt-3 flex flex-wrap gap-2">{PANTRY_STAPLES.map((staple) => <button key={staple} type="button" onClick={() => addPantryStaple(staple)} className="rounded-full border border-border bg-muted px-3 py-2 text-xs font-semibold text-foreground transition hover:-translate-y-0.5 hover:bg-muted">{staple}</button>)}</div></div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-foreground">Ingredient chips</p><button type="button" onClick={addIngredientRow} className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground">Add manual chip</button></div>
                  {formState.ingredients.length === 0 ? (
                    <div className="mt-3 rounded-[1.4rem] border border-dashed border-border bg-white px-4 py-6 text-sm leading-6 text-muted-foreground">Convert a few ingredient lines first, or add a manual chip if you want to edit one ingredient at a time.</div>
                  ) : (
                    <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-2">
                      {formState.ingredients.map((ingredient) => {
                        const style = TYPE_STYLES[ingredient.ingredientType];
                        return (
                          <div key={ingredient.id} className={`rounded-[1.45rem] border p-3 shadow-[0_8px_18px_rgba(90,60,70,0.05)] ${style.card}`}>
                            <div className="flex items-start gap-3">
                              <label className="block min-w-0 flex-1 text-sm"><span className="mb-1 block font-medium text-foreground">Ingredient</span><input value={ingredient.name} onChange={(e) => updateIngredient(ingredient.id, 'name', e.target.value)} placeholder="Garlic" className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary" /></label>
                              <button type="button" onClick={() => removeIngredientRow(ingredient.id)} className="mt-6 rounded-full border border-border bg-white px-3 py-2 text-sm font-semibold text-foreground" aria-label={`Remove ${ingredient.name || 'ingredient'}`}>x</button>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2"><IngredientTypePill type="grocery" active={ingredient.ingredientType === 'grocery'} onClick={() => updateIngredient(ingredient.id, 'ingredientType', 'grocery')} /><IngredientTypePill type="pantry" active={ingredient.ingredientType === 'pantry'} onClick={() => updateIngredient(ingredient.id, 'ingredientType', 'pantry')} /><IngredientTypePill type="optional" active={ingredient.ingredientType === 'optional'} onClick={() => updateIngredient(ingredient.id, 'ingredientType', 'optional')} /></div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <label className="block text-sm"><span className="mb-1 block font-medium text-foreground">Instructions</span><textarea value={formState.instructions} onChange={(e) => setFormState((current) => ({ ...current, instructions: e.target.value }))} rows={5} className="w-full rounded-[1.4rem] border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary" placeholder="Quick cooking steps or notes for future you" /></label>

              <details className="rounded-[1.4rem] border border-border bg-white p-4"><summary className="cursor-pointer list-none text-sm font-semibold text-foreground">Optional notes</summary><div className="mt-4"><label className="block text-sm"><span className="mb-1 block font-medium text-foreground">Recipe notes</span><textarea value={formState.notes} onChange={(e) => setFormState((current) => ({ ...current, notes: e.target.value }))} rows={3} className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary" placeholder="Serving ideas, substitutions, prep reminders" /></label></div></details>

              {formError ? <p className="text-sm text-danger">{formError}</p> : null}
              <button type="submit" disabled={saveState === 'saving'} className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">{saveState === 'saving' ? (formState.id ? 'Saving changes...' : 'Creating dish...') : formState.id ? 'Save changes' : 'Create dish'}</button>
            </form>
          </div>
        </div>
      ) : null}
      {formMessage ? <ToastMessage message={formMessage} onDismiss={() => setFormMessage(null)} /> : null}
    </div>
  );
}























