'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ToastMessage } from '@/components/ui/toast-message';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  calculateLeftoverPortions,
  formatWeekRange,
  getNextMealSlot,
  getWeekDays,
  getWeekStart,
  type PlannerMealType
} from '@/lib/planner';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type HouseholdRow = Database['public']['Tables']['households']['Row'];
type PlanWeekRow = Database['public']['Tables']['plan_weeks']['Row'];
type PlanWeekInsert = Database['public']['Tables']['plan_weeks']['Insert'];
type CookBatchRow = Database['public']['Tables']['cook_batches']['Row'];
type CookBatchInsert = Database['public']['Tables']['cook_batches']['Insert'];
type MealSlotRow = Database['public']['Tables']['meal_slots']['Row'];
type MealSlotInsert = Database['public']['Tables']['meal_slots']['Insert'];
type DishRow = Database['public']['Tables']['dishes']['Row'];
type MealComboRow = Database['public']['Tables']['meal_combos']['Row'];
type MealComboDishRow = Database['public']['Tables']['meal_combo_dishes']['Row'];

type MealTypeOption = PlannerMealType;

type DishOption = Pick<DishRow, 'id' | 'name' | 'category'>;

type ComboWithDishes = MealComboRow & {
  dishes: DishOption[];
};

type PlannerSlot = MealSlotRow & {
  combo: ComboWithDishes | null;
  cookBatch: CookBatchRow | null;
};

type PlannerData = {
  household: HouseholdRow;
  profile: ProfileRow;
  dishes: DishOption[];
  combos: ComboWithDishes[];
  slots: PlannerSlot[];
};

type PlannerFormState = {
  date: string;
  mealType: MealTypeOption;
  mealComboId: string;
  selectedDishIds: string[];
  portionsCooked: number;
  portionsEaten: number;
  assignLeftovers: boolean;
  leftoverTargetDate: string;
  leftoverTargetMealType: MealTypeOption;
  notes: string;
};

const MEAL_TYPES: MealTypeOption[] = ['breakfast', 'lunch', 'dinner'];
const DEFAULT_VISIBLE_MEAL_TYPES: MealTypeOption[] = ['lunch', 'dinner'];
const PLANNER_COMBO_DESCRIPTION = 'Created from weekly planner';

const MEAL_TYPE_LABELS: Record<MealTypeOption, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner'
};

const MEAL_TYPE_ACCENTS: Record<
  MealTypeOption,
  {
    section: string;
    badge: string;
  }
> = {
  breakfast: {
    section: 'border-[#E5E7EB] bg-white shadow-[0_4px_16px_rgba(31,41,51,0.06)]',
    badge: 'bg-[#F3F4F6] text-[#374151]'
  },
  lunch: {
    section: 'border-[#E5E7EB] bg-white shadow-[0_4px_16px_rgba(31,41,51,0.06)]',
    badge: 'bg-[#F1EADF] text-[#4F453B]'
  },
  dinner: {
    section: 'border-[#E5E7EB] bg-white shadow-[0_4px_16px_rgba(31,41,51,0.06)]',
    badge: 'bg-[#F1EADF] text-[#4F453B]'
  }
};

function shiftIsoDate(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function createFormState(
  weekStartDate: string,
  defaultLeftoverEnabled: boolean
): PlannerFormState {
  const defaultDate = weekStartDate;
  const defaultMealType: MealTypeOption = 'dinner';
  const nextSlot = getNextMealSlot(defaultDate, defaultMealType);

  return {
    date: defaultDate,
    mealType: defaultMealType,
    mealComboId: '',
    selectedDishIds: [],
    portionsCooked: 4,
    portionsEaten: 2,
    assignLeftovers: defaultLeftoverEnabled,
    leftoverTargetDate: nextSlot.date,
    leftoverTargetMealType: nextSlot.mealType,
    notes: ''
  };
}

function isPlannerGeneratedCombo(combo: ComboWithDishes | null) {
  return combo?.description === PLANNER_COMBO_DESCRIPTION;
}

function getLeftoverSlotsForCookBatch(
  slots: PlannerSlot[],
  cookBatchId: string | null,
  excludeSlotId?: string
) {
  if (!cookBatchId) {
    return [];
  }

  return slots.filter(
    (slot) =>
      slot.cook_batch_id === cookBatchId &&
      slot.entry_type === 'leftover' &&
      slot.id !== excludeSlotId
  );
}

function formatFriendlyDate(value: string) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });
}

export function PlannerBoard() {
  const initialWeekStart = getWeekStart(new Date());
  const [weekStartDate, setWeekStartDate] = useState(initialWeekStart);
  const [data, setData] = useState<PlannerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [showBreakfast, setShowBreakfast] = useState(false);
  const [formState, setFormState] = useState<PlannerFormState>(() =>
    createFormState(initialWeekStart, true)
  );

  const weekDays = useMemo(() => getWeekDays(weekStartDate), [weekStartDate]);
  const visibleMealTypes = useMemo(
    () => (showBreakfast ? MEAL_TYPES : DEFAULT_VISIBLE_MEAL_TYPES),
    [showBreakfast]
  );

  const dishes = data?.dishes ?? [];
  const hasDishes = dishes.length > 0;

  const slotsByDay = useMemo(() => {
    const map = new Map<string, PlannerSlot[]>();

    (data?.slots ?? []).forEach((slot) => {
      const existing = map.get(slot.date) ?? [];
      existing.push(slot);
      map.set(slot.date, existing);
    });

    return map;
  }, [data?.slots]);

  const slotsByCell = useMemo(() => {
    const map = new Map<string, PlannerSlot[]>();

    (data?.slots ?? []).forEach((slot) => {
      const key = `${slot.date}:${slot.meal_type}`;
      const existing = map.get(key) ?? [];
      existing.push(slot);
      map.set(key, existing);
    });

    return map;
  }, [data?.slots]);


  const editingSlot = useMemo(
    () => data?.slots.find((slot) => slot.id === editingSlotId) ?? null,
    [data, editingSlotId]
  );

  const isEditing = Boolean(editingSlot);
  const isEditingLeftover = editingSlot?.entry_type === 'leftover';
  const loadPlannerData = useCallback(async (targetWeekStart: string) => {
    setIsLoading(true);
    setLoadError(null);

    const supabase = createSupabaseBrowserClient();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .single();

    if (profileError || !profile) {
      setLoadError(profileError?.message ?? 'Household profile could not be loaded.');
      setIsLoading(false);
      return;
    }

    const { data: household, error: householdError } = await supabase
      .from('households')
      .select('*')
      .eq('id', profile.household_id)
      .single();

    if (householdError || !household) {
      setLoadError(householdError?.message ?? 'Household settings could not be loaded.');
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

    const { data: allDishes, error: allDishesError } = await supabase
      .from('dishes')
      .select('id, name, category')
      .order('name', { ascending: true });

    if (allDishesError) {
      setLoadError(allDishesError.message);
      setIsLoading(false);
      return;
    }

    const comboIds = (comboRows ?? []).map((combo) => combo.id);
    let comboDishRows: MealComboDishRow[] = [];
    const dishRows: DishOption[] = allDishes ?? [];

    if (comboIds.length > 0) {
      const { data: joinRows, error: joinError } = await supabase
        .from('meal_combo_dishes')
        .select('*')
        .in('meal_combo_id', comboIds)
        .order('sort_order', { ascending: true });

      if (joinError) {
        setLoadError(joinError.message);
        setIsLoading(false);
        return;
      }

      comboDishRows = joinRows ?? [];
    }

    const dishMap = new Map(dishRows.map((dish) => [dish.id, dish]));
    const dishesByComboId = new Map<string, Pick<DishRow, 'id' | 'name' | 'category'>[]>();

    comboDishRows.forEach((row) => {
      const dish = dishMap.get(row.dish_id);
      if (!dish) {
        return;
      }

      const existing = dishesByComboId.get(row.meal_combo_id) ?? [];
      existing.push(dish);
      dishesByComboId.set(row.meal_combo_id, existing);
    });

    const combos = (comboRows ?? []).map((combo) => ({
      ...combo,
      dishes: dishesByComboId.get(combo.id) ?? []
    }));

    try {
      const weekRow = await ensurePlanWeekRow(supabase, profile.household_id, targetWeekStart);
      if (!weekRow) {
        setLoadError('Planner week could not be created.');
        setIsLoading(false);
        return;
      }

      const { data: slotRows, error: slotError } = await supabase
        .from('meal_slots')
        .select('*')
        .eq('plan_week_id', weekRow.id)
        .order('date', { ascending: true })
        .order('meal_type', { ascending: true })
        .order('created_at', { ascending: true });

      if (slotError) {
        setLoadError(slotError.message);
        setIsLoading(false);
        return;
      }

      const cookBatchIds = Array.from(
        new Set((slotRows ?? []).map((slot) => slot.cook_batch_id).filter(Boolean))
      ) as string[];

      let cookBatches: CookBatchRow[] = [];

      if (cookBatchIds.length > 0) {
        const { data: batchRows, error: batchError } = await supabase
          .from('cook_batches')
          .select('*')
          .in('id', cookBatchIds);

        if (batchError) {
          setLoadError(batchError.message);
          setIsLoading(false);
          return;
        }

        cookBatches = batchRows ?? [];
      }

      const comboMap = new Map(combos.map((combo) => [combo.id, combo]));
      const batchMap = new Map(cookBatches.map((batch) => [batch.id, batch]));

      const slots = (slotRows ?? []).map((slot) => {
        const cookBatch = slot.cook_batch_id ? batchMap.get(slot.cook_batch_id) ?? null : null;
        const comboId = slot.meal_combo_id ?? cookBatch?.meal_combo_id ?? null;

        return {
          ...slot,
          combo: comboId ? comboMap.get(comboId) ?? null : null,
          cookBatch
        };
      });

      setData({ household, profile, dishes: dishRows, combos, slots });
      setFormState((current) => ({
        ...current,
        portionsCooked:
          current.portionsCooked > 0 ? current.portionsCooked : household.default_people_per_meal,
        portionsEaten:
          current.portionsEaten > 0 ? current.portionsEaten : household.default_people_per_meal
      }));
      setIsLoading(false);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Planner data could not be loaded.');
      setIsLoading(false);
    }
  }, []);

  async function ensurePlanWeekRow(
    supabase: ReturnType<typeof createSupabaseBrowserClient>,
    householdId: string,
    targetWeekStart: string
  ) {
    const { data: existingWeek, error: existingWeekError } = await supabase
      .from('plan_weeks')
      .select('*')
      .eq('household_id', householdId)
      .eq('week_start_date', targetWeekStart)
      .maybeSingle();

    if (existingWeekError) {
      throw existingWeekError;
    }

    if (existingWeek) {
      return existingWeek;
    }

    const payload: PlanWeekInsert = {
      household_id: householdId,
      week_start_date: targetWeekStart
    };

    const { data: createdWeek, error: createWeekError } = await supabase
      .from('plan_weeks')
      .insert(payload)
      .select('*')
      .single();

    if (createWeekError) {
      if (createWeekError.code === '23505') {
        const { data: retryWeek, error: retryWeekError } = await supabase
          .from('plan_weeks')
          .select('*')
          .eq('household_id', householdId)
          .eq('week_start_date', targetWeekStart)
          .maybeSingle();

        if (retryWeekError) {
          throw retryWeekError;
        }

        return retryWeek ?? null;
      }

      throw createWeekError;
    }

    return createdWeek;
  }
  useEffect(() => {
    void loadPlannerData(weekStartDate);
  }, [weekStartDate, loadPlannerData]);

  function openAddMeal(date: string, mealType: MealTypeOption) {
    if (!data) {
      return;
    }

    const defaults = data.household;
    const nextSlot = getNextMealSlot(date, mealType);

    setEditingSlotId(null);
    setFormState({
      date,
      mealType,
      mealComboId: '',
      selectedDishIds: [],
      portionsCooked: 4,
      portionsEaten: 2,
      assignLeftovers: defaults?.default_leftover_enabled ?? true,
      leftoverTargetDate: nextSlot.date,
      leftoverTargetMealType: nextSlot.mealType,
      notes: ''
    });
    setSaveError(null);
    setMessage(null);
    setIsModalOpen(true);
  }

  function openEditMeal(slot: PlannerSlot) {
    if (!data) {
      return;
    }

    const nextSlot = getNextMealSlot(slot.date, slot.meal_type as MealTypeOption);
    const relatedLeftoverSlot =
      slot.entry_type === 'cook'
        ? getLeftoverSlotsForCookBatch(data.slots, slot.cook_batch_id, slot.id)[0] ?? null
        : null;
    const plannerGenerated = isPlannerGeneratedCombo(slot.combo);

    setEditingSlotId(slot.id);
    setFormState({
      date: slot.date,
      mealType: slot.meal_type as MealTypeOption,
      mealComboId:
        slot.entry_type === 'cook' && slot.combo && !plannerGenerated ? slot.combo.id : '',
      selectedDishIds:
        slot.entry_type === 'cook' && slot.combo && plannerGenerated
          ? slot.combo.dishes.map((dish) => dish.id)
          : [],
      portionsCooked:
        slot.entry_type === 'cook'
          ? slot.cookBatch?.portions_cooked ?? Math.max(slot.portions_eaten, 1)
          : slot.cookBatch?.portions_cooked ?? slot.portions_eaten,
      portionsEaten: slot.portions_eaten,
      assignLeftovers: slot.entry_type === 'cook' ? Boolean(relatedLeftoverSlot) : false,
      leftoverTargetDate: relatedLeftoverSlot?.date ?? nextSlot.date,
      leftoverTargetMealType: (relatedLeftoverSlot?.meal_type as MealTypeOption | undefined) ?? nextSlot.mealType,
      notes: slot.notes ?? slot.cookBatch?.notes ?? ''
    });
    setSaveError(null);
    setMessage(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingSlotId(null);
    setSaveError(null);
  }

  function toggleDishSelection(dishId: string) {
    setFormState((current) => {
      const alreadySelected = current.selectedDishIds.includes(dishId);
      return {
        ...current,
        selectedDishIds: alreadySelected
          ? current.selectedDishIds.filter((id) => id !== dishId)
          : [...current.selectedDishIds, dishId],
        mealComboId: ''
      };
    });
    setSaveError(null);
  }

  function updatePrimaryMeal(date: string, mealType: MealTypeOption) {
    const nextSlot = getNextMealSlot(date, mealType);
    setFormState((current) => ({
      ...current,
      date,
      mealType,
      leftoverTargetDate: current.assignLeftovers ? nextSlot.date : current.leftoverTargetDate,
      leftoverTargetMealType: current.assignLeftovers ? nextSlot.mealType : current.leftoverTargetMealType
    }));
  }

  async function checkSlotConflict(
    supabase: ReturnType<typeof createSupabaseBrowserClient>,
    householdId: string,
    date: string,
    mealType: MealTypeOption,
    excludeSlotId?: string
  ) {
    const { data: conflictRows, error: conflictError } = await supabase
      .from('meal_slots')
      .select('id')
      .eq('household_id', householdId)
      .eq('date', date)
      .eq('meal_type', mealType)
      .limit(10);

    if (conflictError) {
      throw conflictError;
    }

    return (conflictRows ?? []).some((row) => row.id !== excludeSlotId);
  }

  async function resolveMealComboId(
    supabase: ReturnType<typeof createSupabaseBrowserClient>,
    householdId: string
  ) {
    if (formState.mealComboId) {
      return formState.mealComboId;
    }

    const selectedDishes = (data?.dishes ?? []).filter((dish) =>
      formState.selectedDishIds.includes(dish.id)
    );

    const generatedName = selectedDishes.map((dish) => dish.name).join(' + ') || 'Planner meal';

    const { data: createdCombo, error: createdComboError } = await supabase
      .from('meal_combos')
      .insert({
        household_id: householdId,
        name: generatedName,
        description: PLANNER_COMBO_DESCRIPTION
      })
      .select('id')
      .single();

    if (createdComboError || !createdCombo) {
      throw new Error(createdComboError?.message ?? 'Planner combo could not be created.');
    }

    const comboDishPayload = formState.selectedDishIds.map((dishId, index) => ({
      meal_combo_id: createdCombo.id,
      dish_id: dishId,
      sort_order: index
    }));

    const { error: comboDishError } = await supabase
      .from('meal_combo_dishes')
      .insert(comboDishPayload);

    if (comboDishError) {
      throw new Error(comboDishError.message);
    }

    return createdCombo.id;
  }

  async function deleteCookBatchIfUnused(
    supabase: ReturnType<typeof createSupabaseBrowserClient>,
    cookBatchId: string | null
  ) {
    if (!cookBatchId) {
      return;
    }

    const { data: remainingSlots, error: remainingSlotsError } = await supabase
      .from('meal_slots')
      .select('id')
      .eq('cook_batch_id', cookBatchId);

    if (remainingSlotsError) {
      throw remainingSlotsError;
    }

    if ((remainingSlots ?? []).length === 0) {
      const { error: deleteBatchError } = await supabase
        .from('cook_batches')
        .delete()
        .eq('id', cookBatchId);

      if (deleteBatchError) {
        throw deleteBatchError;
      }
    }
  }

  async function handleSaveMeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!data) {
      setSaveError('Planner is still loading household context.');
      return;
    }

    if (!isEditingLeftover && !formState.mealComboId && formState.selectedDishIds.length === 0) {
      setSaveError('Choose a meal combo or pick at least one dish before saving.');
      return;
    }

    if (formState.portionsCooked <= 0 || formState.portionsEaten <= 0) {
      setSaveError('Cooked and eaten portions must both be at least 1.');
      return;
    }

    if (formState.portionsEaten > formState.portionsCooked) {
      setSaveError('Portions eaten now cannot be greater than portions cooked.');
      return;
    }

    const leftoverPortions = calculateLeftoverPortions(
      formState.portionsCooked,
      formState.portionsEaten
    );

    if (!isEditingLeftover && formState.assignLeftovers && leftoverPortions === 0) {
      setSaveError(
        'There are no leftover portions to assign. Increase cooked portions or turn leftovers off.'
      );
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();

      if (editingSlot?.entry_type === 'leftover') {
        const targetWeek = await ensurePlanWeekRow(
          supabase,
          data.household.id,
          getWeekStart(formState.date)
        );

        if (!targetWeek) {
          throw new Error('Planner week could not be created.');
        }

        const hasConflict = await checkSlotConflict(
          supabase,
          data.household.id,
          formState.date,
          formState.mealType,
          editingSlot.id
        );

        if (hasConflict) {
          const shouldContinue = window.confirm(
            'There is already a meal in that slot. Save anyway and place this leftover there too?'
          );

          if (!shouldContinue) {
            setIsSaving(false);
            return;
          }
        }

        const { error: updateLeftoverError } = await supabase
          .from('meal_slots')
          .update({
            plan_week_id: targetWeek.id,
            date: formState.date,
            meal_type: formState.mealType,
            portions_eaten: formState.portionsEaten,
            notes: formState.notes.trim() || null
          })
          .eq('id', editingSlot.id);

        if (updateLeftoverError) {
          throw updateLeftoverError;
        }

        closeModal();
        setMessage('Leftover meal updated.');
        await loadPlannerData(weekStartDate);
        return;
      }

      const cookWeek = await ensurePlanWeekRow(
        supabase,
        data.household.id,
        getWeekStart(formState.date)
      );

      if (!cookWeek) {
        throw new Error('Cook week could not be created.');
      }

      const existingLeftoverSlot = editingSlot
        ? getLeftoverSlotsForCookBatch(data.slots, editingSlot.cook_batch_id, editingSlot.id)[0] ?? null
        : null;
      const relatedLeftoverCount = editingSlot
        ? getLeftoverSlotsForCookBatch(data.slots, editingSlot.cook_batch_id, editingSlot.id).length
        : 0;

      if (editingSlot && relatedLeftoverCount > 1) {
        throw new Error(
          'This cook batch already has multiple leftover slots. Please edit those leftovers individually.'
        );
      }

      let leftoverWeek: PlanWeekRow | null = null;
      if (formState.assignLeftovers && leftoverPortions > 0) {
        leftoverWeek = await ensurePlanWeekRow(
          supabase,
          data.household.id,
          getWeekStart(formState.leftoverTargetDate)
        );

        const hasConflict = await checkSlotConflict(
          supabase,
          data.household.id,
          formState.leftoverTargetDate,
          formState.leftoverTargetMealType,
          existingLeftoverSlot?.id
        );

        if (hasConflict) {
          const shouldContinue = window.confirm(
            'There is already a meal in that leftover target slot. Save anyway and add another entry there?'
          );

          if (!shouldContinue) {
            setIsSaving(false);
            return;
          }
        }
      }

      const resolvedMealComboId = await resolveMealComboId(supabase, data.household.id);

      if (editingSlot?.entry_type === 'cook') {
        if (!editingSlot.cook_batch_id) {
          throw new Error('This cook meal is missing its cook batch link.');
        }

        const { error: updateCookBatchError } = await supabase
          .from('cook_batches')
          .update({
            meal_combo_id: resolvedMealComboId,
            cooked_date: formState.date,
            cooked_meal_type: formState.mealType,
            portions_cooked: formState.portionsCooked,
            notes: formState.notes.trim() || null
          })
          .eq('id', editingSlot.cook_batch_id);

        if (updateCookBatchError) {
          throw updateCookBatchError;
        }

        const { error: updateCookSlotError } = await supabase
          .from('meal_slots')
          .update({
            plan_week_id: cookWeek.id,
            date: formState.date,
            meal_type: formState.mealType,
            meal_combo_id: resolvedMealComboId,
            portions_eaten: formState.portionsEaten,
            notes: formState.notes.trim() || null
          })
          .eq('id', editingSlot.id);

        if (updateCookSlotError) {
          throw updateCookSlotError;
        }

        if (formState.assignLeftovers && leftoverPortions > 0 && leftoverWeek) {
          if (existingLeftoverSlot) {
            const { error: updateLeftoverSlotError } = await supabase
              .from('meal_slots')
              .update({
                plan_week_id: leftoverWeek.id,
                date: formState.leftoverTargetDate,
                meal_type: formState.leftoverTargetMealType,
                meal_combo_id: resolvedMealComboId,
                portions_eaten: leftoverPortions,
                notes: formState.notes.trim() || null
              })
              .eq('id', existingLeftoverSlot.id);

            if (updateLeftoverSlotError) {
              throw updateLeftoverSlotError;
            }
          } else {
            const leftoverSlotPayload: MealSlotInsert = {
              household_id: data.household.id,
              plan_week_id: leftoverWeek.id,
              date: formState.leftoverTargetDate,
              meal_type: formState.leftoverTargetMealType,
              entry_type: 'leftover',
              meal_combo_id: resolvedMealComboId,
              cook_batch_id: editingSlot.cook_batch_id,
              portions_eaten: leftoverPortions,
              notes: formState.notes.trim() || null
            };

            const { error: createLeftoverSlotError } = await supabase
              .from('meal_slots')
              .insert(leftoverSlotPayload);

            if (createLeftoverSlotError) {
              throw createLeftoverSlotError;
            }
          }
        } else if (existingLeftoverSlot) {
          const { error: deleteLeftoverError } = await supabase
            .from('meal_slots')
            .delete()
            .eq('id', existingLeftoverSlot.id);

          if (deleteLeftoverError) {
            throw deleteLeftoverError;
          }
        }

        closeModal();
        setMessage('Meal updated.');
        await loadPlannerData(weekStartDate);
        return;
      }

      const cookBatchPayload: CookBatchInsert = {
        household_id: data.household.id,
        meal_combo_id: resolvedMealComboId,
        cooked_date: formState.date,
        cooked_meal_type: formState.mealType,
        portions_cooked: formState.portionsCooked,
        notes: formState.notes.trim() || null
      };

      const { data: cookBatch, error: cookBatchError } = await supabase
        .from('cook_batches')
        .insert(cookBatchPayload)
        .select('*')
        .single();

      if (cookBatchError || !cookBatch) {
        throw new Error(cookBatchError?.message ?? 'Cook batch could not be created.');
      }

      const cookSlotPayload: MealSlotInsert = {
        household_id: data.household.id,
        plan_week_id: cookWeek.id,
        date: formState.date,
        meal_type: formState.mealType,
        entry_type: 'cook',
        meal_combo_id: resolvedMealComboId,
        cook_batch_id: cookBatch.id,
        portions_eaten: formState.portionsEaten,
        notes: formState.notes.trim() || null
      };

      const { error: cookSlotError } = await supabase.from('meal_slots').insert(cookSlotPayload);
      if (cookSlotError) {
        throw new Error(cookSlotError.message);
      }

      if (formState.assignLeftovers && leftoverPortions > 0 && leftoverWeek) {
        const leftoverSlotPayload: MealSlotInsert = {
          household_id: data.household.id,
          plan_week_id: leftoverWeek.id,
          date: formState.leftoverTargetDate,
          meal_type: formState.leftoverTargetMealType,
          entry_type: 'leftover',
          meal_combo_id: resolvedMealComboId,
          cook_batch_id: cookBatch.id,
          portions_eaten: leftoverPortions,
          notes: formState.notes.trim() || null
        };

        const { error: leftoverSlotError } = await supabase
          .from('meal_slots')
          .insert(leftoverSlotPayload);

        if (leftoverSlotError) {
          throw new Error(leftoverSlotError.message);
        }
      }

      closeModal();
      setMessage(
        formState.assignLeftovers && leftoverPortions > 0
          ? 'Cook meal and leftover slot added.'
          : 'Cook meal added.'
      );
      await loadPlannerData(weekStartDate);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Meal could not be saved.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteSlot(slot: PlannerSlot) {
    const shouldDelete = window.confirm(
      slot.entry_type === 'cook'
        ? 'Delete this cooked meal slot? Leftovers tied to the cook batch will stay.'
        : 'Delete this meal slot?'
    );

    if (!shouldDelete) {
      return;
    }

    setPendingDeleteId(slot.id);
    setLoadError(null);
    setMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: deleteError } = await supabase.from('meal_slots').delete().eq('id', slot.id);

      if (deleteError) {
        throw deleteError;
      }

      if (slot.entry_type === 'cook') {
        await deleteCookBatchIfUnused(supabase, slot.cook_batch_id);
      }

      setMessage(slot.entry_type === 'leftover' ? 'Leftover slot deleted.' : 'Meal slot deleted.');
      await loadPlannerData(weekStartDate);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Meal slot could not be deleted.');
    } finally {
      setPendingDeleteId(null);
    }
  }
  const getVisibleSlotCountForDay = (dayIso: string) =>
    (slotsByDay.get(dayIso) ?? []).filter((slot) =>
      visibleMealTypes.includes(slot.meal_type as MealTypeOption)
    ).length;

  const renderMealSlotCard = (slot: PlannerSlot) => {
    const relatedLeftoverSlot =
      slot.entry_type === 'cook' && data
        ? (getLeftoverSlotsForCookBatch(data.slots, slot.cook_batch_id, slot.id)[0] ?? null)
        : null;
    const dishes = slot.combo?.dishes ?? [];
    const visibleDishes = dishes.slice(0, 3);
    const extraDishCount = Math.max(0, dishes.length - visibleDishes.length);
    const cookedCount = slot.cookBatch?.portions_cooked ?? slot.portions_eaten;
    const summaryText =
      slot.entry_type === 'cook'
        ? `${cookedCount} cooked, ${slot.portions_eaten} eaten now`
        : `${slot.portions_eaten} portions leftover`;

    return (
      <article className="rounded-[1.5rem] border border-[#E5E7EB] bg-white p-4 shadow-[0_4px_16px_rgba(31,41,51,0.06)]">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs font-bold tracking-[0.14em] ${slot.entry_type === 'cook' ? 'border-[#8B735D] bg-[#8B735D] text-white' : 'border-[#8B735D] bg-white text-[#4F453B]'}`}>
                {slot.entry_type === 'cook' ? 'Cook' : 'Leftover'}
              </span>
              {slot.entry_type === 'cook' && !isPlannerGeneratedCombo(slot.combo) ? (
                <span className="rounded-full border border-[#D3C3AE] bg-white px-3 py-1 text-xs font-semibold text-[#4F453B]">
                  Manual
                </span>
              ) : null}
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-muted-foreground">
                {summaryText}
              </span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {slot.entry_type === 'leftover'
                ? `From ${formatFriendlyDate(slot.cookBatch?.cooked_date ?? slot.date)}`
                : 'Cooked meal'}
            </p>
          </div>
        </div>

        {visibleDishes.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {visibleDishes.map((dish) => (
              <span
                key={`${slot.id}-${dish.id}`}
                className="rounded-full border border-[#E6D8C7] bg-[#F1EADF] px-3 py-2 text-xs font-semibold text-[#4F453B]"
              >
                {dish.name}
              </span>
            ))}
            {extraDishCount > 0 ? (
              <span className="rounded-full border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-medium text-[#6B7280]">
                +{extraDishCount} more
              </span>
            ) : null}
          </div>
        ) : null}

        {slot.entry_type === 'cook' && relatedLeftoverSlot ? (
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Leftover planned for {formatFriendlyDate(relatedLeftoverSlot.date)}
          </p>
        ) : null}

        {slot.notes ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{slot.notes}</p> : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openEditMeal(slot)}
            className="rounded-full border border-[#F5B83D] bg-[#FFF7E0] px-4 py-2 text-sm font-semibold text-[#8A5A00] transition hover:-translate-y-0.5"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => handleDeleteSlot(slot)}
            disabled={pendingDeleteId === slot.id}
            className="rounded-full border border-[#E85D5D] bg-[#FFF0F0] px-4 py-2 text-sm font-semibold text-[#B42323] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingDeleteId === slot.id ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </article>
    );
  };

  const renderMealSection = (day: { isoDate: string }, mealType: MealTypeOption) => {
    const cellKey = `${day.isoDate}:${mealType}`;
    const cellSlots = slotsByCell.get(cellKey) ?? [];

    if (!visibleMealTypes.includes(mealType)) {
      return null;
    }

    return (
      <div key={cellKey} className={`rounded-[1.5rem] border p-4 ${MEAL_TYPE_ACCENTS[mealType].section}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {MEAL_TYPE_LABELS[mealType]}
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {cellSlots.length === 0 ? 'No meal planned yet' : `${cellSlots.length} planned`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => openAddMeal(day.isoDate, mealType)}
            disabled={!hasDishes}
            className="rounded-full border border-[#72B942] bg-[#EEF7EA] px-4 py-2 text-sm font-semibold text-[#3F7D2A] transition hover:-translate-y-0.5 hover:bg-[#E4F3DD] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Add meal
          </button>
        </div>

        {cellSlots.length === 0 ? (
          <div className="mt-4 rounded-[1.25rem] border border-dashed border-border bg-white/80 px-4 py-5 text-sm leading-6 text-muted-foreground">
            This meal is still open.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {cellSlots.map((slot) => renderMealSlotCard(slot))}
          </div>
        )}
      </div>
    );
  };

  const renderDayRow = (day: { isoDate: string; dayLabel: string; dateLabel: string; isToday: boolean }) => {
    const dayCount = getVisibleSlotCountForDay(day.isoDate);

    return (
      <article
        key={day.isoDate}
        className="rounded-[2rem] border border-border bg-white p-4 shadow-[0_10px_28px_rgba(90,60,70,0.06)]"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-5">
          <div className="flex min-w-0 items-start justify-between gap-3 lg:w-[11rem] lg:flex-col lg:justify-start lg:gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {day.dayLabel}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-foreground">{day.dateLabel}</h3>
            </div>
            <div className="flex flex-col items-end gap-2 lg:items-start">
              {day.isToday ? (
                <span className="rounded-full border border-[#D3C3AE] bg-white px-3 py-1 text-xs font-semibold text-[#4F453B]">
                  Today
                </span>
              ) : null}
              <span className="rounded-full border border-[#D3C3AE] bg-white px-3 py-1 text-xs font-semibold text-[#4F453B]">
                {dayCount === 0 ? 'No meals' : `${dayCount} meals`}
              </span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:flex-1">
            {visibleMealTypes.map((mealType) => renderMealSection(day, mealType))}
          </div>
        </div>
      </article>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <section className="rounded-[2rem] border border-border bg-white/90 p-5 shadow-soft">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="mt-4 h-10 rounded bg-muted" />
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-[1.5rem] border border-border bg-white p-4">
                <div className="h-4 w-20 rounded bg-muted" />
                <div className="mt-3 h-5 w-28 rounded bg-muted" />
                <div className="mt-4 h-28 rounded bg-muted" />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900">
        <p className="font-semibold">Planner could not be loaded</p>
        <p className="mt-2">{loadError ?? 'Unknown error.'}</p>
      </div>
    );
  }


  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] border border-border bg-white/90 p-5 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="rounded-[1.35rem] border border-[#D3C3AE] bg-white px-5 py-4 text-base font-semibold text-[#4F453B] shadow-[0_8px_18px_rgba(90,60,70,0.05)] sm:text-lg">
            {formatWeekRange(weekStartDate)}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setWeekStartDate((current) => shiftIsoDate(current, -7))}
                className="rounded-full border border-[#D3C3AE] bg-white px-4 py-3 text-sm font-semibold text-[#4F453B]"
              >
                Previous week
              </button>
              <button
                type="button"
                onClick={() => setWeekStartDate(getWeekStart(new Date()))}
                className="rounded-full border border-[#D3C3AE] bg-white px-4 py-3 text-sm font-semibold text-[#4F453B]"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setWeekStartDate((current) => shiftIsoDate(current, 7))}
                className="rounded-full border border-[#D3C3AE] bg-white px-4 py-3 text-sm font-semibold text-[#4F453B]"
              >
                Next week
              </button>
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
          <label className="inline-flex items-center gap-3 rounded-full border border-[#D3C3AE] bg-white px-4 py-3 text-sm font-medium text-[#4F453B]">
            <input
              type="checkbox"
              checked={showBreakfast}
              onChange={(event) => setShowBreakfast(event.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            Show breakfast
          </label>
        </div>
        {!hasDishes ? (
          <div className="mt-5 rounded-3xl border border-dashed border-border bg-muted/25 p-5 text-sm leading-6 text-muted-foreground">
            Add dishes first to build out the weekly planner.
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
      </section>
      <div className="space-y-4">
        {weekDays.map((day) => renderDayRow(day))}
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-black/35 px-4 py-6 backdrop-blur-sm">
          <div className="mx-auto max-w-2xl rounded-[2rem] border border-[#E5E7EB] bg-white p-5 shadow-[0_4px_16px_rgba(31,41,51,0.06)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  {isEditing ? 'Edit meal' : 'Add meal'}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">
                  {isEditingLeftover
                    ? 'Move or update leftover meal'
                    : isEditing
                      ? 'Update cook meal and leftovers'
                      : 'Create a cook meal and optional leftovers'}
                </h2>
              </div>
              <button type="button" onClick={closeModal} className="rounded-full border border-[#E85D5D] bg-[#FFF0F0] px-4 py-2 text-sm font-semibold text-[#B42323] transition hover:-translate-y-0.5">Close</button>
            </div>

            <form onSubmit={handleSaveMeal} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-foreground">Date</span>
                  <input
                    type="date"
                    value={formState.date}
                    onChange={(event) => updatePrimaryMeal(event.target.value, formState.mealType)}
                    className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
                  />
                </label>

                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-foreground">Meal type</span>
                  <select
                    value={formState.mealType}
                    onChange={(event) =>
                      updatePrimaryMeal(formState.date, event.target.value as MealTypeOption)
                    }
                    className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
                  >
                    {MEAL_TYPES.map((mealType) => (
                      <option key={mealType} value={mealType}>
                        {mealType}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {isEditingLeftover ? (
                <div className="rounded-3xl border border-border bg-white/85 p-4 text-sm leading-6 text-muted-foreground">
                  This leftover stays linked to its original cook batch. You can move it to a different date or meal slot here.
                </div>
              ) : (
                <>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-foreground">Meal combo (optional)</span>
                    <select
                      value={formState.mealComboId}
                      onChange={(event) => {
                        const nextComboId = event.target.value;
                        setFormState((current) => ({
                          ...current,
                          mealComboId: nextComboId,
                          selectedDishIds: nextComboId ? [] : current.selectedDishIds
                        }));
                        setSaveError(null);
                      }}
                      className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
                    >
                      <option value="">Build from dishes instead</option>
                      {data.combos.map((combo) => (
                        <option key={combo.id} value={combo.id}>
                          {combo.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="rounded-3xl border border-border bg-white/85 p-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Dish picker</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Skip combos and pick dishes directly for this plan entry. Choosing dishes clears the combo selection.
                      </p>
                    </div>

                    {!hasDishes ? (
                      <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-4 text-sm text-muted-foreground">
                        Add dishes first to build a planner meal.
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {dishes.map((dish) => {
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
                    )}
                  </div>
                </>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                {!isEditingLeftover ? (
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-foreground">Portions cooked</span>
                    <input
                      type="number"
                      min={1}
                      value={formState.portionsCooked}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          portionsCooked: Number(event.target.value)
                        }))
                      }
                      className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
                    />
                  </label>
                ) : null}

                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-foreground">
                    {isEditingLeftover ? 'Portions in this leftover meal' : 'Portions eaten now'}
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={formState.portionsEaten}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        portionsEaten: Number(event.target.value)
                      }))
                    }
                    className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
                  />
                </label>
              </div>

              {!isEditingLeftover ? (
                <div className="rounded-3xl border border-border bg-white/85 p-4">
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={formState.assignLeftovers}
                      onChange={(event) =>
                        setFormState((current) => ({ ...current, assignLeftovers: event.target.checked }))
                      }
                      className="mt-1 h-4 w-4 rounded border-border"
                    />
                    <span>
                      <span className="block font-medium text-foreground">Assign leftovers</span>
                      <span className="mt-1 block leading-6 text-muted-foreground">
                        Remaining portions: {calculateLeftoverPortions(formState.portionsCooked, formState.portionsEaten)}.
                      </span>
                    </span>
                  </label>

                  {formState.assignLeftovers ? (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm">
                        <span className="mb-1 block font-medium text-foreground">
                          Leftover target date
                        </span>
                        <input
                          type="date"
                          value={formState.leftoverTargetDate}
                          onChange={(event) =>
                            setFormState((current) => ({
                              ...current,
                              leftoverTargetDate: event.target.value
                            }))
                          }
                          className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
                        />
                      </label>

                      <label className="block text-sm">
                        <span className="mb-1 block font-medium text-foreground">
                          Leftover target meal
                        </span>
                        <select
                          value={formState.leftoverTargetMealType}
                          onChange={(event) =>
                            setFormState((current) => ({
                              ...current,
                              leftoverTargetMealType: event.target.value as MealTypeOption
                            }))
                          }
                          className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
                        >
                          {MEAL_TYPES.map((mealType) => (
                            <option key={mealType} value={mealType}>
                              {mealType}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-foreground">Notes</span>
                <textarea
                  value={formState.notes}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, notes: event.target.value }))
                  }
                  rows={3}
                  placeholder={isEditingLeftover ? 'Optional notes for this leftover meal' : 'Optional notes for this cook batch'}
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
                />
              </label>

              {saveError ? <p className="text-sm text-danger">{saveError}</p> : null}

              <button
                type="submit"
                disabled={isSaving}
                className="rounded-full border border-[#72B942] bg-[#EEF7EA] px-4 py-3 text-sm font-semibold text-[#3F7D2A] transition hover:-translate-y-0.5 hover:bg-[#E4F3DD] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving
                  ? isEditing
                    ? 'Saving changes...'
                    : 'Saving meal...'
                  : isEditing
                    ? 'Save changes'
                    : 'Save meal'}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {message ? <ToastMessage message={message} onDismiss={() => setMessage(null)} /> : null}
    </div>
  );
}

























