'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type DishRow = Database['public']['Tables']['dishes']['Row'];
type DishInsert = Database['public']['Tables']['dishes']['Insert'];
type DishUpdate = Database['public']['Tables']['dishes']['Update'];
type DishIngredientRow = Database['public']['Tables']['dish_ingredients']['Row'];
type DishIngredientInsert = Database['public']['Tables']['dish_ingredients']['Insert'];

type IngredientType = 'grocery' | 'pantry' | 'optional';
type DishCategory =
  | 'protein'
  | 'vegetable'
  | 'carb'
  | 'soup'
  | 'side'
  | 'one_pot'
  | 'breakfast'
  | 'snack'
  | 'other';

type DishWithIngredients = DishRow & {
  ingredients: DishIngredientRow[];
};

type IngredientDraft = {
  id: string;
  name: string;
  ingredientType: IngredientType;
};

type FormState = {
  id: string | null;
  name: string;
  category: DishCategory | '';
  instructions: string;
  notes: string;
  ingredients: IngredientDraft[];
};

type SaveState = 'idle' | 'saving';

type FilterCategory = DishCategory | 'all';

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

const INGREDIENT_TYPE_OPTIONS: Array<{ value: IngredientType; label: string; hint: string }> = [
  { value: 'grocery', label: 'Grocery', hint: 'Included in grocery generation later.' },
  { value: 'pantry', label: 'Pantry', hint: 'Excluded from grocery generation by default.' },
  { value: 'optional', label: 'Optional', hint: 'Visible in recipes, excluded from grocery generation.' }
];

function createIngredientDraft(overrides?: Partial<IngredientDraft>): IngredientDraft {
  return {
    id: crypto.randomUUID(),
    name: '',
    ingredientType: 'grocery',
    ...overrides
  };
}

function createEmptyFormState(): FormState {
  return {
    id: null,
    name: '',
    category: '',
    instructions: '',
    notes: '',
    ingredients: [createIngredientDraft()]
  };
}

function toFormState(dish: DishWithIngredients): FormState {
  return {
    id: dish.id,
    name: dish.name,
    category: (dish.category as DishCategory | null) ?? '',
    instructions: dish.instructions ?? '',
    notes: dish.notes ?? '',
    ingredients:
      dish.ingredients.length > 0
        ? dish.ingredients.map((ingredient) =>
            createIngredientDraft({
              id: ingredient.id,
              name: ingredient.name,
              ingredientType: ingredient.ingredient_type as IngredientType
            })
          )
        : [createIngredientDraft()]
  };
}

function normalizeIngredientName(name: string) {
  return name.trim().replace(/\s+/g, ' ');
}

export function DishLibrary() {
  const [dishes, setDishes] = useState<DishWithIngredients[]>([]);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('all');
  const [formState, setFormState] = useState<FormState>(createEmptyFormState());
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    void loadDishes();
  }, []);

  const filteredDishes = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return dishes.filter((dish) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        dish.name.toLowerCase().includes(normalizedSearch) ||
        dish.ingredients.some((ingredient) =>
          ingredient.name.toLowerCase().includes(normalizedSearch)
        );

      const matchesCategory = categoryFilter === 'all' || dish.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [categoryFilter, dishes, search]);

  async function loadDishes() {
    setIsLoading(true);
    setLoadError(null);

    const supabase = createSupabaseBrowserClient();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('household_id')
      .single();

    if (profileError || !profile) {
      setLoadError(profileError?.message ?? 'Household profile could not be loaded.');
      setIsLoading(false);
      return;
    }

    setHouseholdId(profile.household_id);

    const { data: dishData, error: dishError } = await supabase
      .from('dishes')
      .select('*')
      .order('updated_at', { ascending: false });

    if (dishError) {
      setLoadError(dishError.message);
      setIsLoading(false);
      return;
    }

    const dishIds = (dishData ?? []).map((dish) => dish.id);
    let ingredientRows: DishIngredientRow[] = [];

    if (dishIds.length > 0) {
      const { data: ingredientData, error: ingredientError } = await supabase
        .from('dish_ingredients')
        .select('*')
        .in('dish_id', dishIds)
        .order('sort_order', { ascending: true });

      if (ingredientError) {
        setLoadError(ingredientError.message);
        setIsLoading(false);
        return;
      }

      ingredientRows = ingredientData ?? [];
    }

    const ingredientsByDishId = new Map<string, DishIngredientRow[]>();
    ingredientRows.forEach((ingredient) => {
      const existing = ingredientsByDishId.get(ingredient.dish_id) ?? [];
      existing.push(ingredient);
      ingredientsByDishId.set(ingredient.dish_id, existing);
    });

    setDishes(
      (dishData ?? []).map((dish) => ({
        ...dish,
        ingredients: ingredientsByDishId.get(dish.id) ?? []
      }))
    );
    setIsLoading(false);
  }

  function openCreateForm() {
    setFormState(createEmptyFormState());
    setFormError(null);
    setFormMessage(null);
    setIsEditorOpen(true);
  }

  function openEditForm(dish: DishWithIngredients) {
    setFormState(toFormState(dish));
    setFormError(null);
    setFormMessage(null);
    setIsEditorOpen(true);
  }

  function closeEditor() {
    setFormState(createEmptyFormState());
    setFormError(null);
    setIsEditorOpen(false);
  }

  function updateIngredient(
    ingredientId: string,
    key: keyof IngredientDraft,
    value: string
  ) {
    setFormState((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredient) =>
        ingredient.id === ingredientId ? { ...ingredient, [key]: value } : ingredient
      )
    }));
  }

  function addIngredientRow() {
    const hasBlankIngredient = formState.ingredients.some(
      (ingredient) => normalizeIngredientName(ingredient.name).length === 0
    );

    if (hasBlankIngredient) {
      setFormError('Finish the current empty ingredient row before adding another one.');
      return;
    }

    setFormError(null);
    setFormState((current) => ({
      ...current,
      ingredients: [...current.ingredients, createIngredientDraft()]
    }));
  }

  function removeIngredientRow(ingredientId: string) {
    setFormState((current) => {
      const nextIngredients = current.ingredients.filter((ingredient) => ingredient.id !== ingredientId);
      return {
        ...current,
        ingredients: nextIngredients.length > 0 ? nextIngredients : [createIngredientDraft()]
      };
    });
    setFormError(null);
  }

  async function handleSaveDish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = formState.name.trim();
    const normalizedIngredients = formState.ingredients
      .map((ingredient, index) => ({
        name: normalizeIngredientName(ingredient.name),
        ingredientType: ingredient.ingredientType,
        sortOrder: index
      }))
      .filter((ingredient) => ingredient.name.length > 0);

    if (!trimmedName) {
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
    const dishUpdatePayload: DishUpdate = {
      name: trimmedName,
      category: formState.category || null,
      instructions: formState.instructions.trim() || null,
      notes: formState.notes.trim() || null
    };

    let dishId = formState.id;

    if (dishId) {
      const { error: updateError } = await supabase
        .from('dishes')
        .update(dishUpdatePayload)
        .eq('id', dishId);

      if (updateError) {
        setFormError(updateError.message);
        setSaveState('idle');
        return;
      }

      const { error: deleteIngredientsError } = await supabase
        .from('dish_ingredients')
        .delete()
        .eq('dish_id', dishId);

      if (deleteIngredientsError) {
        setFormError(deleteIngredientsError.message);
        setSaveState('idle');
        return;
      }
    } else {
      const dishInsertPayload: DishInsert = {
        household_id: householdId,
        name: trimmedName,
        category: formState.category || null,
        instructions: formState.instructions.trim() || null,
        notes: formState.notes.trim() || null
      };

      const { data: createdDish, error: createError } = await supabase
        .from('dishes')
        .insert(dishInsertPayload)
        .select('id')
        .single();

      if (createError || !createdDish) {
        setFormError(createError?.message ?? 'Dish could not be created.');
        setSaveState('idle');
        return;
      }

      dishId = createdDish.id;
    }

    if (normalizedIngredients.length > 0) {
      const ingredientPayload: DishIngredientInsert[] = normalizedIngredients.map((ingredient) => ({
        dish_id: dishId,
        name: ingredient.name,
        ingredient_type: ingredient.ingredientType,
        sort_order: ingredient.sortOrder
      }));

      const { error: ingredientInsertError } = await supabase
        .from('dish_ingredients')
        .insert(ingredientPayload);

      if (ingredientInsertError) {
        setFormError(ingredientInsertError.message);
        setSaveState('idle');
        return;
      }
    }

    setSaveState('idle');
    closeEditor();
    setFormMessage(formState.id ? 'Dish updated.' : 'Dish created.');
    await loadDishes();
  }

  async function handleDeleteDish(dish: DishWithIngredients) {
    const shouldDelete = window.confirm(`Delete "${dish.name}"? This will remove its ingredients too.`);
    if (!shouldDelete) {
      return;
    }

    setPendingDeleteId(dish.id);
    setLoadError(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from('dishes').delete().eq('id', dish.id);

    setPendingDeleteId(null);

    if (error) {
      setLoadError(error.message);
      return;
    }

    setFormMessage('Dish deleted.');
    await loadDishes();
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[1.75rem] border border-border bg-white/85 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Library
              </p>
              <h2 className="mt-2 text-lg font-semibold">Search and shape your dish library</h2>
            </div>
            <button
              type="button"
              onClick={openCreateForm}
              className="rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5"
            >
              Add dish
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-foreground">Search</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search dishes or ingredients"
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-foreground">Category</span>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value as FilterCategory)}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
              >
                <option value="all">All categories</option>
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {formMessage ? <p className="mt-4 text-sm text-primary">{formMessage}</p> : null}
          {loadError ? <p className="mt-4 text-sm text-danger">{loadError}</p> : null}
        </div>

        <div className="rounded-[1.75rem] border border-border bg-[rgba(255,255,255,0.96)] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Editor
              </p>
              <h2 className="mt-2 text-lg font-semibold">
                {formState.id ? 'Edit dish' : 'Create a new dish'}
              </h2>
            </div>
            {isEditorOpen ? (
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground"
              >
                Cancel
              </button>
            ) : null}
          </div>

          {isEditorOpen ? (
            <form onSubmit={handleSaveDish} className="mt-5 space-y-4">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-foreground">Dish name</span>
                <input
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, name: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
                  placeholder="Stir fry pork"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-foreground">Category</span>
                <select
                  value={formState.category}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      category: event.target.value as DishCategory | ''
                    }))
                  }
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
                >
                  <option value="">No category yet</option>
                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-3xl border border-border bg-muted/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Ingredients</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Use pantry and optional types to keep grocery generation clean later.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addIngredientRow}
                    className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground"
                  >
                    Add ingredient
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {formState.ingredients.map((ingredient, index) => {
                    const optionDetails = INGREDIENT_TYPE_OPTIONS.find(
                      (option) => option.value === ingredient.ingredientType
                    );

                    return (
                      <div key={ingredient.id} className="rounded-2xl border border-border bg-white p-3">
                        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto] md:items-start">
                          <label className="block text-sm">
                            <span className="mb-1 block font-medium text-foreground">
                              Ingredient {index + 1}
                            </span>
                            <input
                              value={ingredient.name}
                              onChange={(event) =>
                                updateIngredient(ingredient.id, 'name', event.target.value)
                              }
                              placeholder="Garlic"
                              className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
                            />
                          </label>

                          <label className="block text-sm">
                            <span className="mb-1 block font-medium text-foreground">Type</span>
                            <select
                              value={ingredient.ingredientType}
                              onChange={(event) =>
                                updateIngredient(
                                  ingredient.id,
                                  'ingredientType',
                                  event.target.value as IngredientType
                                )
                              }
                              className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
                            >
                              {INGREDIENT_TYPE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>

                          <button
                            type="button"
                            onClick={() => removeIngredientRow(ingredient.id)}
                            className="rounded-full border border-border bg-white px-4 py-3 text-sm font-semibold text-foreground"
                          >
                            Remove
                          </button>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                          {optionDetails?.hint}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-foreground">Instructions</span>
                <textarea
                  value={formState.instructions}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, instructions: event.target.value }))
                  }
                  rows={4}
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
                  placeholder="Quick cooking steps or notes for future you"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-foreground">Notes</span>
                <textarea
                  value={formState.notes}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, notes: event.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
                  placeholder="Serving ideas, substitutions, prep reminders"
                />
              </label>

              {formError ? <p className="text-sm text-danger">{formError}</p> : null}

              <button
                type="submit"
                disabled={saveState === 'saving'}
                className="rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saveState === 'saving'
                  ? formState.id
                    ? 'Saving changes...'
                    : 'Creating dish...'
                  : formState.id
                    ? 'Save changes'
                    : 'Create dish'}
              </button>
            </form>
          ) : (
            <div className="mt-5 rounded-3xl border border-dashed border-border bg-muted/35 p-5 text-sm leading-6 text-muted-foreground">
              Tap <span className="font-semibold text-foreground">Add dish</span> to start building your
              household library. You can store ingredients, classify pantry staples, and come back
              later to edit everything.
            </div>
          )}
        </div>
      </section>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-3xl border border-border bg-white p-5">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="mt-4 h-7 w-2/3 rounded bg-muted" />
              <div className="mt-4 h-16 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : filteredDishes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-white/80 p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Empty state
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-foreground">
            {dishes.length === 0 ? 'No dishes yet' : 'No dishes match this filter'}
          </h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {dishes.length === 0
              ? 'Create your first dish to start building meal combos and future grocery lists.'
              : 'Try a different search term or category, or clear the filters to see everything again.'}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {dishes.length === 0 ? (
              <button
                type="button"
                onClick={openCreateForm}
                className="rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
              >
                Create first dish
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setCategoryFilter('all');
                }}
                className="rounded-full border border-border bg-white px-4 py-3 text-sm font-semibold text-foreground"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredDishes.map((dish) => {
            const pantryCount = dish.ingredients.filter(
              (ingredient) => ingredient.ingredient_type === 'pantry'
            ).length;
            const groceryCount = dish.ingredients.filter(
              (ingredient) => ingredient.ingredient_type === 'grocery'
            ).length;

            return (
              <article key={dish.id} className="rounded-[1.75rem] border border-border bg-white p-5 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      {dish.category ?? 'Uncategorized'}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-foreground">{dish.name}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEditForm(dish)}
                      className="rounded-full border border-border bg-white px-3 py-2 text-sm font-semibold text-foreground"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDish(dish)}
                      disabled={pendingDeleteId === dish.id}
                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-900 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {pendingDeleteId === dish.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                    {dish.ingredients.length} ingredients
                  </span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">
                    {groceryCount} grocery
                  </span>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
                    {pantryCount} pantry
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  {dish.ingredients.length > 0 ? (
                    dish.ingredients.map((ingredient) => (
                      <div
                        key={ingredient.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/20 px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-foreground">{ingredient.name}</span>
                        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          {ingredient.ingredient_type}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
                      No ingredients yet.
                    </div>
                  )}
                </div>

                {dish.instructions ? (
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">{dish.instructions}</p>
                ) : null}
                {dish.notes ? (
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">Note: {dish.notes}</p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
