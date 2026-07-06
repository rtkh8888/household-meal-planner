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
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-16 rounded-2xl bg-muted" />
            ))}
          </div>
        </PageSection>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageSection eyebrow="Week" title="This Week’s Groceries">
        <div className="overflow-hidden rounded-[2rem] border border-border bg-white/95 p-5 shadow-[0_12px_34px_rgba(90,60,70,0.06)] sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D8EBCF] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#3F7D2A]">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Grocery week
              </div>
              <div className="mt-4 flex flex-wrap items-start gap-3">
                <div className="rounded-[1.5rem] border border-[#D8EBCF] bg-white px-5 py-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#3F7D2A]">Week range</p>
                  <p className="mt-2 text-2xl font-semibold text-[#1F2933]">{formatWeekRange(weekStartDate)}</p>
                  <p className="mt-1 text-sm text-[#6B7280]">Generated from cooked meals only</p>
                </div>
                <div className="grid min-w-[220px] flex-1 grid-cols-3 gap-3 sm:min-w-[280px]">
                  <div className="rounded-[1.35rem] border border-[#D8EBCF] bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#3F7D2A]">Main</p>
                    <p className="mt-2 text-2xl font-semibold text-[#1F2933]">{totalMainItems}</p>
                    <p className="mt-1 text-xs text-[#6B7280]">shopping items</p>
                  </div>
                  <div className="rounded-[1.35rem] border border-[#D8EBCF] bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#3F7D2A]">Pantry</p>
                    <p className="mt-2 text-2xl font-semibold text-[#1F2933]">{totalPantryItems}</p>
                    <p className="mt-1 text-xs text-[#6B7280]">staples</p>
                  </div>
                  <div className="rounded-[1.35rem] border border-[#D8EBCF] bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#3F7D2A]">Checked</p>
                    <p className="mt-2 text-2xl font-semibold text-[#1F2933]">{checkedCount}</p>
                    <p className="mt-1 text-xs text-[#6B7280]">done</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:shrink-0 lg:justify-end">
              <button
                type="button"
                onClick={() => setWeekStartDate((current) => shiftIsoDate(current, -7))}
                className="rounded-full border border-border bg-white px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-muted/20"
              >
                Previous week
              </button>
              <button
                type="button"
                onClick={() => setWeekStartDate(getWeekStart(new Date()))}
                className="rounded-full border border-border bg-white px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-muted/20"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setWeekStartDate((current) => shiftIsoDate(current, 7))}
                className="rounded-full border border-border bg-white px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-muted/20"
              >
                Next week
              </button>
              <button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={isGenerating}
                className="rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGenerating ? 'Generating...' : 'Generate grocery list'}
              </button>
            </div>
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
        <form onSubmit={handleAddManualItem} className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <input
            value={manualItemName}
            onChange={(event) => setManualItemName(event.target.value)}
            placeholder="Add a manual grocery item"
            className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary"
          />
          <button
            type="submit"
            disabled={isAddingManual}
            className="rounded-full border border-border bg-white px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-muted/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
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
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {data?.mainItems.map((item) => (
              <div
                key={item.id}
                className={`group flex h-full min-h-[72px] flex-col justify-between gap-2 rounded-[1.35rem] border bg-white px-3 py-3 shadow-[0_6px_18px_rgba(90,60,70,0.045)] transition ${
                  item.is_checked ? 'border-border/70 opacity-65' : 'border-border'
                }`}
              >
                <label className="flex min-w-0 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.is_checked}
                    disabled={pendingToggleId === item.id}
                    onChange={() => void handleToggleItem(item)}
                    className="h-4.5 w-4.5 shrink-0 rounded-full border-border text-primary focus:ring-primary/30"
                  />
                  <span className="min-w-0">
                    <span className={`block text-sm font-semibold leading-5 ${item.is_checked ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                      {item.name}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground sm:hidden">
                      Tap the checkbox to mark it off.
                    </span>
                  </span>
                </label>
                <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                  <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {item.is_manual ? 'Manual' : 'Generated'}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleDeleteItem(item)}
                    disabled={pendingDeleteId === item.id}
                    aria-label={`Delete ${item.name}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-900 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className={`text-lg leading-none ${pendingDeleteId === item.id ? 'animate-pulse' : ''}`}>×</span>
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
          <div className="rounded-[1.75rem] border border-[#D8EBCF] bg-white p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#3F7D2A]">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#EAF6E2] text-[10px] font-bold text-[#3F7D2A]">•</span>
              Pantry staples used this week
            </div>
            <div className="flex flex-wrap gap-2">
              {data?.pantryItems.map((item) => (
                <span key={item.id} className="rounded-full border border-border bg-white px-3 py-1.5 text-sm font-medium text-foreground shadow-[0_4px_10px_rgba(90,60,70,0.04)]">
                  {item.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </PageSection>
      {toastMessage ? <ToastMessage message={toastMessage} onDismiss={() => setToastMessage(null)} /> : null}
    </div>
  );
}










