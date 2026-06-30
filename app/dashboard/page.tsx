import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { PageSection } from '@/components/layout/page-section';
import { getSupabaseStatus } from '@/lib/supabase/client';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getWeekStart } from '@/lib/planner';
import type { Database } from '@/types/database';

type MealSlotRow = Database['public']['Tables']['meal_slots']['Row'];
type CookBatchRow = Database['public']['Tables']['cook_batches']['Row'];
type MealComboRow = Database['public']['Tables']['meal_combos']['Row'];
type MealComboDishRow = Database['public']['Tables']['meal_combo_dishes']['Row'];
type DishRow = Database['public']['Tables']['dishes']['Row'];
type GroceryItemRow = Database['public']['Tables']['grocery_items']['Row'];

type DashboardMealSlot = MealSlotRow & {
  comboName: string;
  dishNames: string[];
  portionsCooked: number | null;
};

type DashboardStat = {
  label: string;
  value: string;
  hint: string;
  tintClass: string;
  dotClass: string;
};

const MEAL_TYPE_ORDER = {
  breakfast: 0,
  lunch: 1,
  dinner: 2
} as const;

function shiftIsoDate(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatFriendlyDate(value: string) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });
}

function getWeekRangeLabel(weekStartDate: string) {
  const weekEndDate = shiftIsoDate(weekStartDate, 6);
  const start = new Date(`${weekStartDate}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });
  const end = new Date(`${weekEndDate}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });

  return `${start} - ${end}`;
}

async function enrichSlots(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  slots: MealSlotRow[]
): Promise<DashboardMealSlot[]> {
  if (slots.length === 0) {
    return [];
  }

  const cookBatchIds = Array.from(
    new Set(slots.map((slot) => slot.cook_batch_id).filter(Boolean))
  ) as string[];

  let cookBatches: CookBatchRow[] = [];
  if (cookBatchIds.length > 0) {
    const { data, error } = await supabase.from('cook_batches').select('*').in('id', cookBatchIds);
    if (error) {
      throw error;
    }
    cookBatches = data ?? [];
  }

  const cookBatchMap = new Map(cookBatches.map((batch) => [batch.id, batch]));
  const comboIds = Array.from(
    new Set(
      slots
        .map((slot) =>
          slot.meal_combo_id ??
          (slot.cook_batch_id ? cookBatchMap.get(slot.cook_batch_id)?.meal_combo_id ?? null : null)
        )
        .filter(Boolean)
    )
  ) as string[];

  let combos: MealComboRow[] = [];
  let comboDishRows: MealComboDishRow[] = [];
  let dishes: Pick<DishRow, 'id' | 'name'>[] = [];

  if (comboIds.length > 0) {
    const { data: comboData, error: comboError } = await supabase
      .from('meal_combos')
      .select('*')
      .in('id', comboIds);

    if (comboError) {
      throw comboError;
    }

    combos = comboData ?? [];

    const { data: joinData, error: joinError } = await supabase
      .from('meal_combo_dishes')
      .select('*')
      .in('meal_combo_id', comboIds)
      .order('sort_order', { ascending: true });

    if (joinError) {
      throw joinError;
    }

    comboDishRows = joinData ?? [];

    const dishIds = Array.from(new Set(comboDishRows.map((row) => row.dish_id)));
    if (dishIds.length > 0) {
      const { data: dishData, error: dishError } = await supabase
        .from('dishes')
        .select('id, name')
        .in('id', dishIds);

      if (dishError) {
        throw dishError;
      }

      dishes = dishData ?? [];
    }
  }

  const comboMap = new Map(combos.map((combo) => [combo.id, combo]));
  const dishMap = new Map(dishes.map((dish) => [dish.id, dish.name]));
  const dishNamesByComboId = new Map<string, string[]>();

  comboDishRows.forEach((row) => {
    const current = dishNamesByComboId.get(row.meal_combo_id) ?? [];
    const dishName = dishMap.get(row.dish_id);
    if (dishName) {
      current.push(dishName);
      dishNamesByComboId.set(row.meal_combo_id, current);
    }
  });

  return [...slots]
    .sort((left, right) => {
      if (left.date !== right.date) {
        return left.date.localeCompare(right.date);
      }

      const leftOrder = MEAL_TYPE_ORDER[left.meal_type as keyof typeof MEAL_TYPE_ORDER] ?? 99;
      const rightOrder = MEAL_TYPE_ORDER[right.meal_type as keyof typeof MEAL_TYPE_ORDER] ?? 99;
      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return left.created_at.localeCompare(right.created_at);
    })
    .map((slot) => {
      const cookBatch = slot.cook_batch_id ? cookBatchMap.get(slot.cook_batch_id) ?? null : null;
      const comboId = slot.meal_combo_id ?? cookBatch?.meal_combo_id ?? null;
      const combo = comboId ? comboMap.get(comboId) ?? null : null;

      return {
        ...slot,
        comboName: combo?.name ?? 'Planned meal',
        dishNames: comboId ? dishNamesByComboId.get(comboId) ?? [] : [],
        portionsCooked: cookBatch?.portions_cooked ?? null
      };
    });
}

function DashboardMealList({
  title,
  dateLabel,
  slots,
  emptyMessage
}: {
  title: string;
  dateLabel: string;
  slots: DashboardMealSlot[];
  emptyMessage: string;
}) {
  return (
    <PageSection eyebrow={title} title={dateLabel}>
      {slots.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-border bg-white/85 p-5 text-sm leading-6 text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-3">
          {slots.map((slot) => (
            <article
              key={slot.id}
              className="rounded-[1.5rem] border border-border bg-white/96 p-4 shadow-[0_10px_22px_rgba(90,60,70,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(90,60,70,0.08)]"
            >
              <div className="flex flex-wrap items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <span>{toTitleCase(slot.meal_type)}</span>
                <span className="rounded-full border border-lime/50 bg-lime/55 px-3 py-1 tracking-[0.14em] text-foreground">
                  {slot.entry_type === 'cook' ? 'Cook' : 'Leftover'}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-semibold tracking-tight text-foreground">
                {slot.comboName}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Portions eaten: {slot.portions_eaten}
                {slot.portionsCooked ? ` of ${slot.portionsCooked} cooked` : ''}
              </p>
              {slot.dishNames.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {slot.dishNames.map((dishName) => (
                    <span
                      key={`${slot.id}-${dishName}`}
                      className="rounded-full border border-border bg-[rgba(255,255,255,0.98)] px-3 py-2 text-xs font-medium text-foreground"
                    >
                      {dishName}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </PageSection>
  );
}

function DashboardHeroIcon() {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-[1.4rem] border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(220,207,252,0.3))] shadow-[0_12px_24px_rgba(90,60,70,0.08)]">
      <svg viewBox="0 0 48 48" className="h-8 w-8 text-primary" fill="none" aria-hidden="true">
        <path
          d="M14.5 24.5C14.5 17.6 19.8 12 26.4 12c4.8 0 8.9 2.9 10.8 7"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M13 26h22.5c0 5.9-5.6 10.7-12.6 10.7S13 31.9 13 26Z"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M25.2 14.4c1.3 1.4 1.7 3 1.1 4.4-.5 1.1-1.6 1.8-2.8 2.4-.7-1.2-1.3-2.5-1.1-3.8.2-1.6 1.2-2.6 2.8-3Z"
          fill="currentColor"
          opacity="0.88"
        />
        <path
          d="M20.2 16.2c.9 1 .9 2.3.1 3.2-.4.5-1 .8-1.7 1.1-.4-.8-.6-1.7-.4-2.5.2-1 .8-1.6 2-1.8Z"
          fill="currentColor"
          opacity="0.58"
        />
      </svg>
    </div>
  );
}

export default async function DashboardPage() {
  const supabaseStatus = getSupabaseStatus();

  if (!supabaseStatus.ready) {
    return (
      <AppShell
        title="Dashboard"
        description="A calm home base for your household meal library, weekly plan, leftovers, and grocery flow."
      >
        <PageSection eyebrow="Environment" title="Supabase configuration missing">
          <p className="text-sm leading-6 text-muted-foreground">
            Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code>.env.local</code> to unlock authentication, planner data, and grocery generation.
          </p>
        </PageSection>
      </AppShell>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('household_id, display_name')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return (
      <AppShell
        title="Dashboard"
        description="A calm home base for your household meal library, weekly plan, leftovers, and grocery flow."
      >
        <PageSection eyebrow="Profile" title="We could not load your household profile">
          <p className="text-sm leading-6 text-muted-foreground">
            Try refreshing the page. If that still fails, sign out and back in so the app can rebuild your household context.
          </p>
        </PageSection>
      </AppShell>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = shiftIsoDate(today, 1);
  const weekStartDate = getWeekStart(today);
  const weekEndDate = shiftIsoDate(weekStartDate, 6);

  const [
    householdResult,
    dishCountResult,
    comboCountResult,
    weekSlotsResult,
    agendaSlotsResult,
    planWeekResult
  ] = await Promise.all([
    supabase
      .from('households')
      .select('id, name, default_people_per_meal, default_leftover_enabled')
      .eq('id', profile.household_id)
      .single(),
    supabase.from('dishes').select('id', { count: 'exact', head: true }),
    supabase.from('meal_combos').select('id', { count: 'exact', head: true }),
    supabase
      .from('meal_slots')
      .select('*')
      .eq('household_id', profile.household_id)
      .gte('date', weekStartDate)
      .lte('date', weekEndDate),
    supabase
      .from('meal_slots')
      .select('*')
      .eq('household_id', profile.household_id)
      .gte('date', today)
      .lte('date', tomorrow),
    supabase
      .from('plan_weeks')
      .select('id')
      .eq('household_id', profile.household_id)
      .eq('week_start_date', weekStartDate)
      .maybeSingle()
  ]);

  if (householdResult.error || !householdResult.data) {
    return (
      <AppShell
        title="Dashboard"
        description="A calm home base for your household meal library, weekly plan, leftovers, and grocery flow."
      >
        <PageSection eyebrow="Household" title="We could not load your household settings">
          <p className="text-sm leading-6 text-muted-foreground">
            The authenticated household could not be loaded right now. Try refreshing the page or signing out and back in.
          </p>
        </PageSection>
      </AppShell>
    );
  }

  if (dishCountResult.error || comboCountResult.error || weekSlotsResult.error || agendaSlotsResult.error || planWeekResult.error) {
    return (
      <AppShell
        title="Dashboard"
        description="A calm home base for your household meal library, weekly plan, leftovers, and grocery flow."
      >
        <PageSection eyebrow="Dashboard" title="We hit a loading problem">
          <p className="text-sm leading-6 text-muted-foreground">
            Some dashboard data could not be loaded just now. Refresh the page and try again. Your saved dishes and plans are still in Supabase.
          </p>
        </PageSection>
      </AppShell>
    );
  }

  const household = householdResult.data;
  const weekSlots = weekSlotsResult.data ?? [];
  const agendaSlots = agendaSlotsResult.data ?? [];

  const [todaySlots, tomorrowSlots] = await Promise.all([
    enrichSlots(
      supabase,
      agendaSlots.filter((slot) => slot.date === today)
    ),
    enrichSlots(
      supabase,
      agendaSlots.filter((slot) => slot.date === tomorrow)
    )
  ]);

  let groceryItemCount = 0;
  if (planWeekResult.data) {
    const { data: groceryList } = await supabase
      .from('grocery_lists')
      .select('id')
      .eq('household_id', profile.household_id)
      .eq('plan_week_id', planWeekResult.data.id)
      .maybeSingle();

    if (groceryList) {
      const { count } = await supabase
        .from('grocery_items')
        .select('id', { count: 'exact', head: true })
        .eq('grocery_list_id', groceryList.id)
        .neq('source_type', 'pantry_reference' as GroceryItemRow['source_type']);

      groceryItemCount = count ?? 0;
    }
  }

  const weeklyPlannedMeals = weekSlots.length;
  const cookedMealCount = weekSlots.filter((slot) => slot.entry_type === 'cook').length;
  const leftoverMealCount = weekSlots.filter((slot) => slot.entry_type === 'leftover').length;

  const stats: DashboardStat[] = [
    {
      label: 'Dishes',
      value: String(dishCountResult.count ?? 0),
      hint: 'Household library ready to plan from',
      tintClass: 'bg-lavender/65',
      dotClass: 'bg-lavender'
    },
    {
      label: 'Combos',
      value: String(comboCountResult.count ?? 0),
      hint: 'Optional reusable meal bundles',
      tintClass: 'bg-secondary/55',
      dotClass: 'bg-secondary'
    },
    {
      label: 'Planned meals',
      value: String(weeklyPlannedMeals),
      hint: `${cookedMealCount} cook, ${leftoverMealCount} leftover this week`,
      tintClass: 'bg-accent/65',
      dotClass: 'bg-accent'
    },
    {
      label: 'Groceries',
      value: String(groceryItemCount),
      hint: 'Main grocery items for this week',
      tintClass: 'bg-peach/70',
      dotClass: 'bg-peach'
    }
  ];

  return (
    <AppShell
      title="Dashboard"
      description="A calm home base for your household meal library, weekly plan, leftovers, and grocery flow."
    >
      <div className="space-y-5 lg:space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-border bg-white/96 shadow-[0_12px_32px_rgba(90,60,70,0.06)]">
          <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-lavender/35 blur-3xl" />
          <div className="absolute -left-10 bottom-[-3rem] h-36 w-36 rounded-full bg-secondary/30 blur-3xl" />
          <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="relative p-5 sm:p-6 lg:p-7">
              <div className="flex items-center gap-3">
                <DashboardHeroIcon />
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    This week
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-[2.15rem] sm:leading-tight">
                    Your household is set for {getWeekRangeLabel(weekStartDate)}
                  </h2>
                </div>
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-[0.98rem]">
                {weeklyPlannedMeals > 0
                  ? `You have ${weeklyPlannedMeals} planned meal slots this week, with leftovers enabled by default for ${household.default_people_per_meal} people per meal.`
                  : `No meals are planned yet for this week. Start with dishes, then map out the week and generate groceries from cooked meals.`}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground shadow-[0_8px_18px_rgba(90,60,70,0.05)]">
                  {household.default_people_per_meal} people per meal
                </span>
                <span className="rounded-full border border-secondary/40 bg-secondary/28 px-4 py-2 text-sm font-medium text-foreground shadow-[0_8px_18px_rgba(90,60,70,0.04)]">
                  Leftovers {household.default_leftover_enabled ? 'on' : 'off'}
                </span>
                <span className="rounded-full border border-lavender/50 bg-lavender/55 px-4 py-2 text-sm font-medium text-foreground shadow-[0_8px_18px_rgba(90,60,70,0.04)]">
                  {getWeekRangeLabel(weekStartDate)}
                </span>
                <span className="rounded-full border border-accent/40 bg-accent/55 px-4 py-2 text-sm font-medium text-foreground shadow-[0_8px_18px_rgba(90,60,70,0.04)]">
                  {household.name || 'Home'}
                </span>
              </div>
            </div>

            <div className="border-t border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(252,252,253,0.92))] p-5 sm:p-6 lg:border-l lg:border-t-0 lg:p-7">
              <div className="grid gap-3 sm:grid-cols-2">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className={`relative overflow-hidden rounded-[1.6rem] border border-border p-4 shadow-[0_10px_22px_rgba(90,60,70,0.05)] ${stat.tintClass}`}
                  >
                    <div className="absolute right-3 top-3 h-10 w-10 rounded-full bg-white/45 blur-[1px]" />
                    <div className={`h-2.5 w-2.5 rounded-full ${stat.dotClass}`} />
                    <p className="mt-4 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-foreground/70">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{stat.value}</p>
                    <p className="mt-2 max-w-[14rem] text-sm leading-6 text-foreground/70">
                      {stat.hint}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <DashboardMealList
            title="Today"
            dateLabel={formatFriendlyDate(today)}
            slots={todaySlots}
            emptyMessage="Nothing is planned for today yet. Open the planner when you are ready to fill the next slot."
          />
          <DashboardMealList
            title="Tomorrow"
            dateLabel={formatFriendlyDate(tomorrow)}
            slots={tomorrowSlots}
            emptyMessage="Tomorrow is still open. That can be a good time to assign leftovers or line up a quick cook meal."
          />
        </section>

        <PageSection eyebrow="Household defaults" title="Planner behavior at a glance">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-border bg-lavender/35 p-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Default people per meal
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                {household.default_people_per_meal}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-border bg-secondary/32 p-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Leftovers by default
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                {household.default_leftover_enabled ? 'On' : 'Off'}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            You can update both settings anytime from the settings page if your household rhythm changes.
          </p>
          <div className="mt-4">
            <Link
              href="/settings"
              className="inline-flex rounded-full border border-border bg-white px-4 py-3 text-sm font-medium text-foreground transition hover:-translate-y-0.5 hover:border-lavender/50 hover:shadow-[0_12px_22px_rgba(90,60,70,0.08)]"
            >
              Open settings
            </Link>
          </div>
        </PageSection>
      </div>
    </AppShell>
  );
}
