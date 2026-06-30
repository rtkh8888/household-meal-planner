'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { PageSection } from '@/components/layout/page-section';
import { ToastMessage } from '@/components/ui/toast-message';
import {
  formatWeekRange,
  getWeekStart,
  shiftIsoDate as shiftPlannerIsoDate
} from '@/lib/grocery-week';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type PlanWeekInsert = Database['public']['Tables']['plan_weeks']['Insert'];
type GroceryListInsert = Database['public']['Tables']['grocery_lists']['Insert'];
type GroceryItemRow = Database['public']['Tables']['grocery_items']['Row'];
type GroceryItemInsert = Database['public']['Tables']['grocery_items']['Insert'];
type CookBatchRow = Database['public']['Tables']['cook_batches']['Row'];
type MealComboRow = Database['public']['Tables']['meal_combos']['Row'];
type MealComboDishRow = Database['public']['Tables']['meal_combo_dishes']['Row'];
type DishRow = Database['public']['Tables']['dishes']['Row'];
type DishIngredientRow = Database['public']['Tables']['dish_ingredients']['Row'];

type GroceryItemView = GroceryItemRow;
type GrocerySourceType = GroceryItemRow['source_type'];

type GroceryBoardData = {
  groceryListId: string | null;
  mainItems: GroceryItemView[];
  pantryItems: GroceryItemView[];
  hasPlanWeek: boolean;
  cookedMealCount: number;
};

function shiftIsoDate(value: string, days: number) {
  return shiftPlannerIsoDate(value, days);
}

function normalizeIngredientName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function formatIngredientName(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function sortItemsByName<T extends { name: string }>(items: T[]) {
  return [...items].sort((left, right) => left.name.localeCompare(right.name));
}

export function GroceryBoard() {
  const initialWeekStart = getWeekStart(new Date());
  const [weekStartDate, setWeekStartDate] = useState(initialWeekStart);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [data, setData] = useState<GroceryBoardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [manualItemName, setManualItemName] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadWeekData(weekStartDate);
  }, [weekStartDate]);


  const totalMainItems = data?.mainItems.length ?? 0;
  const totalPantryItems = data?.pantryItems.length ?? 0;
  const checkedCount = useMemo(
    () => data?.mainItems.filter((item) => item.is_checked).length ?? 0,
    [data?.mainItems]
  );

  async function ensurePlanWeekRow(
    supabase: ReturnType<typeof createSupabaseBrowserClient>,
    currentHouseholdId: string,
    targetWeekStart: string
  ) {
    const { data: existingWeek, error: existingWeekError } = await supabase
      .from('plan_weeks')
      .select('*')
      .eq('household_id', currentHouseholdId)
      .eq('week_start_date', targetWeekStart)
      .maybeSingle();

    if (existingWeekError) {
      throw existingWeekError;
    }

    if (existingWeek) {
      return existingWeek;
    }

    const payload: PlanWeekInsert = {
      household_id: currentHouseholdId,
      week_start_date: targetWeekStart
    };

    const { data: createdWeek, error: createWeekError } = await supabase
      .from('plan_weeks')
      .insert(payload)
      .select('*')
      .single();

    if (createWeekError) {
      throw createWeekError;
    }

    return createdWeek;
  }

  async function ensureGroceryListRow(
    supabase: ReturnType<typeof createSupabaseBrowserClient>,
    currentHouseholdId: string,
    planWeekId: string
  ) {
    const { data: existingList, error: existingListError } = await supabase
      .from('grocery_lists')
      .select('*')
      .eq('household_id', currentHouseholdId)
      .eq('plan_week_id', planWeekId)
      .maybeSingle();

    if (existingListError) {
      throw existingListError;
    }

    if (existingList) {
      return existingList;
    }

    const payload: GroceryListInsert = {
      household_id: currentHouseholdId,
      plan_week_id: planWeekId
    };

    const { data: createdList, error: createListError } = await supabase
      .from('grocery_lists')
      .insert(payload)
      .select('*')
      .single();

    if (createListError) {
      throw createListError;
    }

    return createdList;
  }

  async function loadWeekData(targetWeekStart: string) {
    setIsLoading(true);
    setLoadError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('household_id')
        .single();

      if (profileError || !profile) {
        throw new Error(profileError?.message ?? 'Household profile could not be loaded.');
      }

      setHouseholdId(profile.household_id);

      const { data: planWeek, error: planWeekError } = await supabase
        .from('plan_weeks')
        .select('*')
        .eq('household_id', profile.household_id)
        .eq('week_start_date', targetWeekStart)
        .maybeSingle();

      if (planWeekError) {
        throw planWeekError;
      }

      if (!planWeek) {
        setData({
          groceryListId: null,
          mainItems: [],
          pantryItems: [],
          hasPlanWeek: false,
          cookedMealCount: 0
        });
        setIsLoading(false);
        return;
      }

      const [{ data: groceryList, error: groceryListError }, { data: cookSlots, error: cookSlotsError }] =
        await Promise.all([
          supabase
            .from('grocery_lists')
            .select('*')
            .eq('household_id', profile.household_id)
            .eq('plan_week_id', planWeek.id)
            .maybeSingle(),
          supabase
            .from('meal_slots')
            .select('id')
            .eq('plan_week_id', planWeek.id)
            .eq('entry_type', 'cook')
        ]);

      if (groceryListError) {
        throw groceryListError;
      }

      if (cookSlotsError) {
        throw cookSlotsError;
      }

      let groceryItems: GroceryItemRow[] = [];
      if (groceryList) {
        const { data: itemRows, error: itemError } = await supabase
          .from('grocery_items')
          .select('*')
          .eq('grocery_list_id', groceryList.id)
          .order('is_checked', { ascending: true })
          .order('created_at', { ascending: true });

        if (itemError) {
          throw itemError;
        }

        groceryItems = itemRows ?? [];
      }

      setData({
        groceryListId: groceryList?.id ?? null,
        mainItems: groceryItems.filter((item) => item.source_type !== 'pantry_reference'),
        pantryItems: groceryItems.filter((item) => item.source_type === 'pantry_reference'),
        hasPlanWeek: true,
        cookedMealCount: (cookSlots ?? []).length
      });
      setIsLoading(false);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Grocery list could not be loaded.');
      setIsLoading(false);
    }
  }

  async function handleGenerate() {
    if (!householdId) {
      setLoadError('Household context is not ready yet.');
      return;
    }

    setIsGenerating(true);
    setLoadError(null);
    setManualError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const planWeek = await ensurePlanWeekRow(supabase, householdId, weekStartDate);
      const groceryList = await ensureGroceryListRow(supabase, householdId, planWeek.id);

      const { data: existingItems, error: existingItemsError } = await supabase
        .from('grocery_items')
        .select('*')
        .eq('grocery_list_id', groceryList.id);

      if (existingItemsError) {
        throw existingItemsError;
      }

      const { data: cookSlots, error: cookSlotsError } = await supabase
        .from('meal_slots')
        .select('*')
        .eq('plan_week_id', planWeek.id)
        .eq('entry_type', 'cook');

      if (cookSlotsError) {
        throw cookSlotsError;
      }

      const cookBatchIds = Array.from(
        new Set((cookSlots ?? []).map((slot) => slot.cook_batch_id).filter(Boolean))
      ) as string[];

      let cookBatches: CookBatchRow[] = [];
      if (cookBatchIds.length > 0) {
        const { data: batchRows, error: batchError } = await supabase
          .from('cook_batches')
          .select('*')
          .in('id', cookBatchIds);

        if (batchError) {
          throw batchError;
        }

        cookBatches = batchRows ?? [];
      }

      const batchMap = new Map(cookBatches.map((batch) => [batch.id, batch]));
      const comboIds = Array.from(
        new Set(
          (cookSlots ?? [])
            .map((slot) =>
              slot.cook_batch_id
                ? batchMap.get(slot.cook_batch_id)?.meal_combo_id ?? slot.meal_combo_id
                : slot.meal_combo_id
            )
            .filter(Boolean)
        )
      ) as string[];

      let mealCombos: MealComboRow[] = [];
      if (comboIds.length > 0) {
        const { data: comboRows, error: comboError } = await supabase
          .from('meal_combos')
          .select('*')
          .in('id', comboIds);

        if (comboError) {
          throw comboError;
        }

        mealCombos = comboRows ?? [];
      }

      const validComboIds = mealCombos.map((combo) => combo.id);
      let comboDishRows: MealComboDishRow[] = [];
      if (validComboIds.length > 0) {
        const { data: joinRows, error: joinError } = await supabase
          .from('meal_combo_dishes')
          .select('*')
          .in('meal_combo_id', validComboIds)
          .order('sort_order', { ascending: true });

        if (joinError) {
          throw joinError;
        }

        comboDishRows = joinRows ?? [];
      }

      const dishIds = Array.from(new Set(comboDishRows.map((row) => row.dish_id)));
      let dishes: Pick<DishRow, 'id' | 'name'>[] = [];
      if (dishIds.length > 0) {
        const { data: dishRows, error: dishError } = await supabase
          .from('dishes')
          .select('id, name')
          .in('id', dishIds);

        if (dishError) {
          throw dishError;
        }

        dishes = dishRows ?? [];
      }

      const validDishIds = Array.from(new Set(dishes.map((dish) => dish.id)));
      let ingredientRows: DishIngredientRow[] = [];
      if (validDishIds.length > 0) {
        const { data: fetchedIngredients, error: ingredientError } = await supabase
          .from('dish_ingredients')
          .select('*')
          .in('dish_id', validDishIds)
          .order('sort_order', { ascending: true });

        if (ingredientError) {
          throw ingredientError;
        }

        ingredientRows = fetchedIngredients ?? [];
      }

      const dishIdsByComboId = new Map<string, string[]>();
      comboDishRows.forEach((row) => {
        const current = dishIdsByComboId.get(row.meal_combo_id) ?? [];
        current.push(row.dish_id);
        dishIdsByComboId.set(row.meal_combo_id, current);
      });

      const ingredientsByDishId = new Map<string, DishIngredientRow[]>();
      ingredientRows.forEach((ingredient) => {
        const current = ingredientsByDishId.get(ingredient.dish_id) ?? [];
        current.push(ingredient);
        ingredientsByDishId.set(ingredient.dish_id, current);
      });

      const generatedNames = new Map<string, string>();
      const pantryNames = new Map<string, string>();

      comboIds.forEach((comboId) => {
        const comboDishIds = dishIdsByComboId.get(comboId) ?? [];
        comboDishIds.forEach((dishId) => {
          const ingredients = ingredientsByDishId.get(dishId) ?? [];
          ingredients.forEach((ingredient) => {
            const normalized = normalizeIngredientName(ingredient.name);
            if (!normalized) {
              return;
            }

            const formatted = formatIngredientName(ingredient.name);
            if (ingredient.ingredient_type === 'grocery') {
              if (!generatedNames.has(normalized)) {
                generatedNames.set(normalized, formatted);
              }
              return;
            }

            if (ingredient.ingredient_type === 'pantry' && !pantryNames.has(normalized)) {
              pantryNames.set(normalized, formatted);
            }
          });
        });
      });

      const existingGeneratedChecks = new Map<string, boolean>();
      (existingItems ?? []).forEach((item) => {
        if (item.source_type === 'generated') {
          existingGeneratedChecks.set(normalizeIngredientName(item.name), item.is_checked);
        }
      });

      const removableIds = (existingItems ?? [])
        .filter((item) => !item.is_manual)
        .map((item) => item.id);

      if (removableIds.length > 0) {
        const { error: removeError } = await supabase
          .from('grocery_items')
          .delete()
          .in('id', removableIds);

        if (removeError) {
          throw removeError;
        }
      }

      const generatedPayload: GroceryItemInsert[] = sortItemsByName(
        Array.from(generatedNames.entries()).map(([normalized, name]) => ({
          grocery_list_id: groceryList.id,
          name,
          source_type: 'generated' as GrocerySourceType,
          is_checked: existingGeneratedChecks.get(normalized) ?? false,
          is_manual: false
        }))
      );

      const pantryPayload: GroceryItemInsert[] = sortItemsByName(
        Array.from(pantryNames.values()).map((name) => ({
          grocery_list_id: groceryList.id,
          name,
          source_type: 'pantry_reference' as GrocerySourceType,
          is_checked: false,
          is_manual: false
        }))
      );

      const insertPayload = [...generatedPayload, ...pantryPayload];
      if (insertPayload.length > 0) {
        const { error: insertError } = await supabase.from('grocery_items').insert(insertPayload);
        if (insertError) {
          throw insertError;
        }
      }

      setToastMessage('Grocery list generated.');
      await loadWeekData(weekStartDate);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Grocery list could not be generated.');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleToggleItem(item: GroceryItemView) {
    setPendingToggleId(item.id);
    setLoadError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from('grocery_items')
        .update({ is_checked: !item.is_checked })
        .eq('id', item.id);

      if (error) {
        throw error;
      }

      await loadWeekData(weekStartDate);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Item could not be updated.');
    } finally {
      setPendingToggleId(null);
    }
  }

  async function handleDeleteItem(item: GroceryItemView) {
    const shouldDelete = window.confirm(
      item.is_manual
        ? 'Delete this manual grocery item?'
        : 'Delete this grocery item? Generated items will come back after regeneration if they still apply.'
    );

    if (!shouldDelete) {
      return;
    }

    setPendingDeleteId(item.id);
    setLoadError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.from('grocery_items').delete().eq('id', item.id);

      if (error) {
        throw error;
      }

      await loadWeekData(weekStartDate);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Item could not be deleted.');
    } finally {
      setPendingDeleteId(null);
    }
  }

  async function handleAddManualItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!householdId) {
      setManualError('Household context is not ready yet.');
      return;
    }

    const normalizedName = formatIngredientName(manualItemName);
    if (!normalizedName) {
      setManualError('Enter an item name before adding it.');
      return;
    }

    setIsAddingManual(true);
    setManualError(null);
    setLoadError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const planWeek = await ensurePlanWeekRow(supabase, householdId, weekStartDate);
      const groceryList = await ensureGroceryListRow(supabase, householdId, planWeek.id);

      const payload: GroceryItemInsert = {
        grocery_list_id: groceryList.id,
        name: normalizedName,
        source_type: 'manual',
        is_checked: false,
        is_manual: true
      };

      const { error } = await supabase.from('grocery_items').insert(payload);
      if (error) {
        throw error;
      }

      setManualItemName('');
      await loadWeekData(weekStartDate);
    } catch (error) {
      setManualError(error instanceof Error ? error.message : 'Manual item could not be added.');
    } finally {
      setIsAddingManual(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PageSection eyebrow="Week" title="Grocery loading">
          <div className="h-20 rounded-3xl bg-muted" />
        </PageSection>
        <PageSection eyebrow="Checklist" title="Preparing grocery items">
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-16 rounded-2xl bg-muted" />
            ))}
          </div>
        </PageSection>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageSection eyebrow="Week" title="Generate from cooked meals only">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm leading-6 text-muted-foreground">
              Groceries come from cook meal slots and cook batches only. Leftovers do not add duplicate ingredients.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <div className="rounded-2xl border border-border bg-muted/20 px-4 py-3">
                <p className="font-semibold text-foreground">{formatWeekRange(weekStartDate)}</p>
                <p className="mt-1 text-muted-foreground">Week of {weekStartDate}</p>
              </div>
              <div className="rounded-2xl border border-border bg-white px-4 py-3">
                <p className="font-semibold text-foreground">{totalMainItems} main items</p>
                <p className="mt-1 text-muted-foreground">{checkedCount} checked off</p>
              </div>
              <div className="rounded-2xl border border-border bg-white px-4 py-3">
                <p className="font-semibold text-foreground">{totalPantryItems} pantry staples</p>
                <p className="mt-1 text-muted-foreground">{data?.cookedMealCount ?? 0} cooked meals in week</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button type="button" onClick={() => setWeekStartDate((current) => shiftIsoDate(current, -7))} className="rounded-full border border-border bg-white px-4 py-3 text-sm font-semibold text-foreground">
              Previous week
            </button>
            <button type="button" onClick={() => setWeekStartDate(getWeekStart(new Date()))} className="rounded-full border border-border bg-white px-4 py-3 text-sm font-semibold text-foreground">
              Today
            </button>
            <button type="button" onClick={() => setWeekStartDate((current) => shiftIsoDate(current, 7))} className="rounded-full border border-border bg-white px-4 py-3 text-sm font-semibold text-foreground">
              Next week
            </button>
            <button type="button" onClick={() => void handleGenerate()} disabled={isGenerating} className="rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60">
              {isGenerating ? 'Generating...' : 'Generate grocery list'}
            </button>
          </div>
        </div>
      </PageSection>

      {loadError ? (
        <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900">
          <p className="font-semibold">Grocery list error</p>
          <p className="mt-2">{loadError}</p>
        </div>
      ) : null}

      <PageSection eyebrow="Checklist" title="Main grocery list">
        <form onSubmit={handleAddManualItem} className="mb-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={manualItemName}
            onChange={(event) => setManualItemName(event.target.value)}
            placeholder="Add a manual grocery item"
            className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
          />
          <button type="submit" disabled={isAddingManual} className="rounded-full border border-border bg-white px-4 py-3 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-60">
            {isAddingManual ? 'Adding...' : 'Add item'}
          </button>
        </form>

        {manualError ? <p className="mb-4 text-sm text-danger">{manualError}</p> : null}

        {data && data.mainItems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-5 text-sm leading-6 text-muted-foreground">
            {data.hasPlanWeek || data.groceryListId
              ? 'No grocery items yet for this week. Generate the list after planning cooked meals, or add a manual item now.'
              : 'No weekly plan exists for this week yet. Plan some cooked meals first, then generate the grocery list.'}
          </div>
        ) : (
          <div className="space-y-3">
            {data?.mainItems.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex min-w-0 items-center gap-3">
                  <input
                    type="checkbox"
                    checked={item.is_checked}
                    disabled={pendingToggleId === item.id}
                    onChange={() => void handleToggleItem(item)}
                    className="h-4 w-4 rounded border-border"
                  />
                  <span className={`text-sm font-medium ${item.is_checked ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {item.name}
                  </span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {item.is_manual ? 'Manual' : 'Generated'}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleDeleteItem(item)}
                    disabled={pendingDeleteId === item.id}
                    className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pendingDeleteId === item.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageSection>

      <PageSection eyebrow="Pantry" title="Pantry staples used this week">
        {data && data.pantryItems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-5 text-sm leading-6 text-muted-foreground">
            No pantry staples were detected from cooked meals for this week yet.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data?.pantryItems.map((item) => (
              <span key={item.id} className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground">
                {item.name}
              </span>
            ))}
          </div>
        )}
      </PageSection>
      {toastMessage ? <ToastMessage message={toastMessage} onDismiss={() => setToastMessage(null)} /> : null}
    </div>
  );
}



