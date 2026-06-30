'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ToastMessage } from '@/components/ui/toast-message';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type DishRow = Database['public']['Tables']['dishes']['Row'];
type MealComboRow = Database['public']['Tables']['meal_combos']['Row'];
type MealComboInsert = Database['public']['Tables']['meal_combos']['Insert'];
type MealComboUpdate = Database['public']['Tables']['meal_combos']['Update'];
type MealComboDishRow = Database['public']['Tables']['meal_combo_dishes']['Row'];
type MealComboDishInsert = Database['public']['Tables']['meal_combo_dishes']['Insert'];

type ComboDishOption = Pick<DishRow, 'id' | 'name' | 'category'>;

type ComboWithDishes = MealComboRow & {
  dishes: ComboDishOption[];
};

type ComboFormState = {
  id: string | null;
  name: string;
  description: string;
  selectedDishIds: string[];
};

type SaveState = 'idle' | 'saving';

function createEmptyFormState(): ComboFormState {
  return {
    id: null,
    name: '',
    description: '',
    selectedDishIds: []
  };
}

function toFormState(combo: ComboWithDishes): ComboFormState {
  return {
    id: combo.id,
    name: combo.name,
    description: combo.description ?? '',
    selectedDishIds: combo.dishes.map((dish) => dish.id)
  };
}

export function ComboLibrary() {
  const [combos, setCombos] = useState<ComboWithDishes[]>([]);
  const [dishOptions, setDishOptions] = useState<ComboDishOption[]>([]);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [formState, setFormState] = useState<ComboFormState>(createEmptyFormState());
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    void loadComboData();
  }, []);

  const selectedDishes = useMemo(
    () => dishOptions.filter((dish) => formState.selectedDishIds.includes(dish.id)),
    [dishOptions, formState.selectedDishIds]
  );

  async function loadComboData() {
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

    const { data: dishes, error: dishesError } = await supabase
      .from('dishes')
      .select('id, name, category')
      .order('name', { ascending: true });

    if (dishesError) {
      setLoadError(dishesError.message);
      setIsLoading(false);
      return;
    }

    const { data: comboRows, error: combosError } = await supabase
      .from('meal_combos')
      .select('*')
      .order('updated_at', { ascending: false });

    if (combosError) {
      setLoadError(combosError.message);
      setIsLoading(false);
      return;
    }

    const comboIds = (comboRows ?? []).map((combo) => combo.id);
    let comboDishRows: MealComboDishRow[] = [];

    if (comboIds.length > 0) {
      const { data: comboDishData, error: comboDishError } = await supabase
        .from('meal_combo_dishes')
        .select('*')
        .in('meal_combo_id', comboIds)
        .order('sort_order', { ascending: true });

      if (comboDishError) {
        setLoadError(comboDishError.message);
        setIsLoading(false);
        return;
      }

      comboDishRows = comboDishData ?? [];
    }

    const dishMap = new Map<string, ComboDishOption>();
    (dishes ?? []).forEach((dish) => dishMap.set(dish.id, dish));

    const dishesByComboId = new Map<string, ComboDishOption[]>();
    comboDishRows.forEach((comboDish) => {
      const dish = dishMap.get(comboDish.dish_id);
      if (!dish) {
        return;
      }
      const existing = dishesByComboId.get(comboDish.meal_combo_id) ?? [];
      existing.push(dish);
      dishesByComboId.set(comboDish.meal_combo_id, existing);
    });

    setDishOptions(dishes ?? []);
    setCombos(
      (comboRows ?? []).map((combo) => ({
        ...combo,
        dishes: dishesByComboId.get(combo.id) ?? []
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

  function openEditForm(combo: ComboWithDishes) {
    setFormState(toFormState(combo));
    setFormError(null);
    setFormMessage(null);
    setIsEditorOpen(true);
  }

  function closeEditor() {
    setFormState(createEmptyFormState());
    setFormError(null);
    setIsEditorOpen(false);
  }

  function toggleDishSelection(dishId: string) {
    setFormState((current) => {
      const alreadySelected = current.selectedDishIds.includes(dishId);
      return {
        ...current,
        selectedDishIds: alreadySelected
          ? current.selectedDishIds.filter((id) => id !== dishId)
          : [...current.selectedDishIds, dishId]
      };
    });
    setFormError(null);
  }

  function removeSelectedDish(dishId: string) {
    setFormState((current) => ({
      ...current,
      selectedDishIds: current.selectedDishIds.filter((id) => id !== dishId)
    }));
    setFormError(null);
  }

  async function handleSaveCombo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = formState.name.trim();

    if (!trimmedName) {
      setFormError('Meal combo name is required.');
      return;
    }

    if (formState.selectedDishIds.length === 0) {
      setFormError('Select at least one dish for this combo.');
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
    const comboUpdatePayload: MealComboUpdate = {
      name: trimmedName,
      description: formState.description.trim() || null
    };

    let comboId = formState.id;

    if (comboId) {
      const { error: updateError } = await supabase
        .from('meal_combos')
        .update(comboUpdatePayload)
        .eq('id', comboId);

      if (updateError) {
        setFormError(updateError.message);
        setSaveState('idle');
        return;
      }

      const { error: deleteJoinRowsError } = await supabase
        .from('meal_combo_dishes')
        .delete()
        .eq('meal_combo_id', comboId);

      if (deleteJoinRowsError) {
        setFormError(deleteJoinRowsError.message);
        setSaveState('idle');
        return;
      }
    } else {
      const comboInsertPayload: MealComboInsert = {
        household_id: householdId,
        name: trimmedName,
        description: formState.description.trim() || null
      };

      const { data: createdCombo, error: createError } = await supabase
        .from('meal_combos')
        .insert(comboInsertPayload)
        .select('id')
        .single();

      if (createError || !createdCombo) {
        setFormError(createError?.message ?? 'Meal combo could not be created.');
        setSaveState('idle');
        return;
      }

      comboId = createdCombo.id;
    }

    const comboDishPayload: MealComboDishInsert[] = formState.selectedDishIds.map((dishId, index) => ({
      meal_combo_id: comboId,
      dish_id: dishId,
      sort_order: index
    }));

    const { error: joinInsertError } = await supabase
      .from('meal_combo_dishes')
      .insert(comboDishPayload);

    if (joinInsertError) {
      setFormError(joinInsertError.message);
      setSaveState('idle');
      return;
    }

    setSaveState('idle');
    closeEditor();
    setFormMessage(formState.id ? 'Meal combo updated.' : 'Meal combo created.');
    await loadComboData();
  }

  async function handleDeleteCombo(combo: ComboWithDishes) {
    const shouldDelete = window.confirm(`Delete "${combo.name}"? The original dishes will stay in your library.`);
    if (!shouldDelete) {
      return;
    }

    setPendingDeleteId(combo.id);
    setLoadError(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from('meal_combos').delete().eq('id', combo.id);

    setPendingDeleteId(null);

    if (error) {
      setLoadError(error.message);
      return;
    }

    setFormMessage('Meal combo deleted.');
    await loadComboData();
  }

  const noDishesYet = !isLoading && dishOptions.length === 0;

  return (
    <div className="space-y-4">
      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[1.75rem] border border-border bg-white/85 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Library
              </p>
              <h2 className="mt-2 text-lg font-semibold">Build reusable combos from your dishes</h2>
            </div>
            <button
              type="button"
              onClick={openCreateForm}
              disabled={noDishesYet}
              className="rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add combo
            </button>
          </div>

          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Use combos for repeatable plates like dinner for two, batch-cook sets, or easy leftover-friendly meal bundles.
          </p>
          {loadError ? <p className="mt-4 text-sm text-danger">{loadError}</p> : null}
          {noDishesYet ? (
            <div className="mt-5 rounded-3xl border border-dashed border-border bg-muted/35 p-5 text-sm leading-6 text-muted-foreground">
              Create dishes first, then come back here to build meal combos.
              <div className="mt-4">
                <Link
                  href="/dishes"
                  className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                  Go to dishes
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-[1.75rem] border border-border bg-[rgba(255,255,255,0.96)] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Builder
              </p>
              <h2 className="mt-2 text-lg font-semibold">
                {formState.id ? 'Edit meal combo' : 'Create a new meal combo'}
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
            <form onSubmit={handleSaveCombo} className="mt-5 space-y-4">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-foreground">Combo name</span>
                <input
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, name: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
                  placeholder="Pork + Rice + Broccoli"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-foreground">Description</span>
                <textarea
                  value={formState.description}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, description: event.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
                  placeholder="Optional notes for when this combo works best"
                />
              </label>

              <div className="rounded-3xl border border-border bg-muted/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Dish picker</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Select the dishes that belong to this combo. The order shown here is the order saved.
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {dishOptions.map((dish) => {
                    const isSelected = formState.selectedDishIds.includes(dish.id);
                    return (
                      <label
                        key={dish.id}
                        className="flex items-start gap-3 rounded-2xl border border-border bg-white px-4 py-3 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleDishSelection(dish.id)}
                          className="mt-1 h-4 w-4 rounded border-border"
                        />
                        <span>
                          <span className="block font-medium text-foreground">{dish.name}</span>
                          <span className="mt-1 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            {dish.category ?? 'uncategorized'}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-white p-4">
                <p className="text-sm font-semibold text-foreground">Selected dishes</p>
                {selectedDishes.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {selectedDishes.map((dish, index) => (
                      <div
                        key={dish.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/20 px-3 py-3 text-sm"
                      >
                        <div>
                          <p className="font-medium text-foreground">
                            {index + 1}. {dish.name}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            {dish.category ?? 'uncategorized'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSelectedDish(dish.id)}
                          className="rounded-full border border-border bg-white px-3 py-2 text-sm font-semibold text-foreground"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Select one or more dishes to preview the combo here.
                  </p>
                )}
              </div>

              {formError ? <p className="text-sm text-danger">{formError}</p> : null}

              <button
                type="submit"
                disabled={saveState === 'saving'}
                className="rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saveState === 'saving'
                  ? formState.id
                    ? 'Saving changes...'
                    : 'Creating combo...'
                  : formState.id
                    ? 'Save changes'
                    : 'Create combo'}
              </button>
            </form>
          ) : (
            <div className="mt-5 rounded-3xl border border-dashed border-border bg-muted/35 p-5 text-sm leading-6 text-muted-foreground">
              Tap <span className="font-semibold text-foreground">Add combo</span> to build a reusable meal set from your dish library.
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
      ) : combos.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-white/80 p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Empty state
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-foreground">No meal combos yet</h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Build your first combo to reuse common plate combinations across the weekly planner.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {dishOptions.length > 0 ? (
              <button
                type="button"
                onClick={openCreateForm}
                className="rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
              >
                Create first combo
              </button>
            ) : (
              <Link
                href="/dishes"
                className="rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
              >
                Create dishes first
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {combos.map((combo) => (
            <article key={combo.id} className="rounded-[1.75rem] border border-border bg-white p-5 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Meal combo
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-foreground">{combo.name}</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEditForm(combo)}
                    className="rounded-full border border-border bg-white px-3 py-2 text-sm font-semibold text-foreground"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCombo(combo)}
                    disabled={pendingDeleteId === combo.id}
                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pendingDeleteId === combo.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                  {combo.dishes.length} dishes
                </span>
              </div>

              {combo.description ? (
                <p className="mt-4 text-sm leading-6 text-muted-foreground">{combo.description}</p>
              ) : null}

              <div className="mt-4 space-y-2">
                {combo.dishes.map((dish, index) => (
                  <div
                    key={`${combo.id}-${dish.id}`}
                    className="rounded-2xl border border-border bg-muted/20 px-3 py-3 text-sm"
                  >
                    <p className="font-medium text-foreground">
                      {index + 1}. {dish.name}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {dish.category ?? 'uncategorized'}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      {formMessage ? <ToastMessage message={formMessage} onDismiss={() => setFormMessage(null)} /> : null}
    </div>
  );
}
