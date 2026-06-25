create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_household_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select household_id
  from public.profiles
  where id = auth.uid()
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_household_id uuid;
  household_name text;
  profile_name text;
begin
  household_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'household_name', ''),
    initcap(regexp_replace(split_part(coalesce(new.email, 'household'), '@', 1), '[._-]+', ' ', 'g')) || ' Household'
  );

  profile_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    initcap(regexp_replace(split_part(coalesce(new.email, 'member'), '@', 1), '[._-]+', ' ', 'g'))
  );

  insert into public.households (name, created_by)
  values (household_name, new.id)
  returning id into new_household_id;

  insert into public.profiles (id, household_id, display_name)
  values (new.id, new_household_id, profile_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  default_people_per_meal integer not null default 2,
  default_leftover_enabled boolean not null default true,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint households_default_people_per_meal_check check (default_people_per_meal > 0),
  constraint households_created_by_unique unique (created_by)
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  household_id uuid not null references public.households (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dishes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  category text,
  instructions text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dishes_category_check check (
    category is null or category in (
      'protein',
      'vegetable',
      'carb',
      'soup',
      'side',
      'one_pot',
      'breakfast',
      'snack',
      'other'
    )
  )
);

create table if not exists public.dish_ingredients (
  id uuid primary key default gen_random_uuid(),
  dish_id uuid not null references public.dishes (id) on delete cascade,
  name text not null,
  ingredient_type text not null default 'grocery',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dish_ingredients_type_check check (ingredient_type in ('grocery', 'pantry', 'optional')),
  constraint dish_ingredients_sort_order_check check (sort_order >= 0)
);

create table if not exists public.meal_combos (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meal_combo_dishes (
  id uuid primary key default gen_random_uuid(),
  meal_combo_id uuid not null references public.meal_combos (id) on delete cascade,
  dish_id uuid not null references public.dishes (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint meal_combo_dishes_sort_order_check check (sort_order >= 0),
  constraint meal_combo_dishes_unique unique (meal_combo_id, dish_id)
);

create table if not exists public.plan_weeks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  week_start_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plan_weeks_household_week_unique unique (household_id, week_start_date)
);

create table if not exists public.cook_batches (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  meal_combo_id uuid references public.meal_combos (id) on delete set null,
  cooked_date date not null,
  cooked_meal_type text not null,
  portions_cooked integer not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cook_batches_meal_type_check check (cooked_meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  constraint cook_batches_portions_check check (portions_cooked > 0)
);

create table if not exists public.meal_slots (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  plan_week_id uuid not null references public.plan_weeks (id) on delete cascade,
  date date not null,
  meal_type text not null,
  entry_type text not null,
  meal_combo_id uuid references public.meal_combos (id) on delete set null,
  cook_batch_id uuid references public.cook_batches (id) on delete set null,
  portions_eaten integer not null default 2,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meal_slots_meal_type_check check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  constraint meal_slots_entry_type_check check (entry_type in ('cook', 'leftover', 'manual')),
  constraint meal_slots_portions_check check (portions_eaten > 0),
  constraint meal_slots_entry_relation_check check (
    (entry_type = 'cook' and meal_combo_id is not null)
    or (entry_type = 'leftover' and cook_batch_id is not null)
    or (entry_type = 'manual')
  )
);

create table if not exists public.grocery_lists (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  plan_week_id uuid not null references public.plan_weeks (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grocery_lists_household_plan_unique unique (household_id, plan_week_id)
);

create table if not exists public.grocery_items (
  id uuid primary key default gen_random_uuid(),
  grocery_list_id uuid not null references public.grocery_lists (id) on delete cascade,
  name text not null,
  source_type text not null default 'generated',
  is_checked boolean not null default false,
  is_manual boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grocery_items_source_type_check check (source_type in ('generated', 'manual', 'pantry_reference', 'optional'))
);

create index if not exists households_created_by_idx on public.households (created_by);
create index if not exists profiles_household_id_idx on public.profiles (household_id);
create index if not exists dishes_household_id_idx on public.dishes (household_id);
create index if not exists dish_ingredients_dish_id_idx on public.dish_ingredients (dish_id);
create index if not exists meal_combos_household_id_idx on public.meal_combos (household_id);
create index if not exists meal_combo_dishes_meal_combo_id_idx on public.meal_combo_dishes (meal_combo_id);
create index if not exists meal_combo_dishes_dish_id_idx on public.meal_combo_dishes (dish_id);
create index if not exists plan_weeks_household_id_idx on public.plan_weeks (household_id);
create index if not exists plan_weeks_week_start_date_idx on public.plan_weeks (week_start_date);
create index if not exists cook_batches_household_id_idx on public.cook_batches (household_id);
create index if not exists cook_batches_meal_combo_id_idx on public.cook_batches (meal_combo_id);
create index if not exists cook_batches_cooked_date_idx on public.cook_batches (cooked_date);
create index if not exists meal_slots_household_id_idx on public.meal_slots (household_id);
create index if not exists meal_slots_plan_week_id_idx on public.meal_slots (plan_week_id);
create index if not exists meal_slots_date_idx on public.meal_slots (date);
create index if not exists grocery_lists_household_id_idx on public.grocery_lists (household_id);
create index if not exists grocery_lists_plan_week_id_idx on public.grocery_lists (plan_week_id);
create index if not exists grocery_items_grocery_list_id_idx on public.grocery_items (grocery_list_id);
create index if not exists grocery_items_is_checked_idx on public.grocery_items (is_checked);

alter table public.households enable row level security;
alter table public.profiles enable row level security;
alter table public.dishes enable row level security;
alter table public.dish_ingredients enable row level security;
alter table public.meal_combos enable row level security;
alter table public.meal_combo_dishes enable row level security;
alter table public.plan_weeks enable row level security;
alter table public.cook_batches enable row level security;
alter table public.meal_slots enable row level security;
alter table public.grocery_lists enable row level security;
alter table public.grocery_items enable row level security;

create policy "households_select_own"
on public.households
for select
using (
  id = public.current_household_id()
  or created_by = auth.uid()
);

create policy "households_insert_own"
on public.households
for insert
with check (created_by = auth.uid());

create policy "households_update_own"
on public.households
for update
using (
  id = public.current_household_id()
  or created_by = auth.uid()
)
with check (
  id = public.current_household_id()
  or created_by = auth.uid()
);

create policy "profiles_select_own"
on public.profiles
for select
using (id = auth.uid());

create policy "profiles_insert_own"
on public.profiles
for insert
with check (id = auth.uid());

create policy "profiles_update_own"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "dishes_household_access"
on public.dishes
for all
using (household_id = public.current_household_id())
with check (household_id = public.current_household_id());

create policy "dish_ingredients_household_access"
on public.dish_ingredients
for all
using (
  exists (
    select 1
    from public.dishes d
    where d.id = dish_id
      and d.household_id = public.current_household_id()
  )
)
with check (
  exists (
    select 1
    from public.dishes d
    where d.id = dish_id
      and d.household_id = public.current_household_id()
  )
);

create policy "meal_combos_household_access"
on public.meal_combos
for all
using (household_id = public.current_household_id())
with check (household_id = public.current_household_id());

create policy "meal_combo_dishes_household_access"
on public.meal_combo_dishes
for all
using (
  exists (
    select 1
    from public.meal_combos mc
    where mc.id = meal_combo_id
      and mc.household_id = public.current_household_id()
  )
)
with check (
  exists (
    select 1
    from public.meal_combos mc
    where mc.id = meal_combo_id
      and mc.household_id = public.current_household_id()
  )
);

create policy "plan_weeks_household_access"
on public.plan_weeks
for all
using (household_id = public.current_household_id())
with check (household_id = public.current_household_id());

create policy "cook_batches_household_access"
on public.cook_batches
for all
using (household_id = public.current_household_id())
with check (household_id = public.current_household_id());

create policy "meal_slots_household_access"
on public.meal_slots
for all
using (household_id = public.current_household_id())
with check (household_id = public.current_household_id());

create policy "grocery_lists_household_access"
on public.grocery_lists
for all
using (household_id = public.current_household_id())
with check (household_id = public.current_household_id());

create policy "grocery_items_household_access"
on public.grocery_items
for all
using (
  exists (
    select 1
    from public.grocery_lists gl
    where gl.id = grocery_list_id
      and gl.household_id = public.current_household_id()
  )
)
with check (
  exists (
    select 1
    from public.grocery_lists gl
    where gl.id = grocery_list_id
      and gl.household_id = public.current_household_id()
  )
);

drop trigger if exists set_households_updated_at on public.households;
create trigger set_households_updated_at
before update on public.households
for each row execute function public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_dishes_updated_at on public.dishes;
create trigger set_dishes_updated_at
before update on public.dishes
for each row execute function public.set_updated_at();

drop trigger if exists set_dish_ingredients_updated_at on public.dish_ingredients;
create trigger set_dish_ingredients_updated_at
before update on public.dish_ingredients
for each row execute function public.set_updated_at();

drop trigger if exists set_meal_combos_updated_at on public.meal_combos;
create trigger set_meal_combos_updated_at
before update on public.meal_combos
for each row execute function public.set_updated_at();

drop trigger if exists set_plan_weeks_updated_at on public.plan_weeks;
create trigger set_plan_weeks_updated_at
before update on public.plan_weeks
for each row execute function public.set_updated_at();

drop trigger if exists set_cook_batches_updated_at on public.cook_batches;
create trigger set_cook_batches_updated_at
before update on public.cook_batches
for each row execute function public.set_updated_at();

drop trigger if exists set_meal_slots_updated_at on public.meal_slots;
create trigger set_meal_slots_updated_at
before update on public.meal_slots
for each row execute function public.set_updated_at();

drop trigger if exists set_grocery_lists_updated_at on public.grocery_lists;
create trigger set_grocery_lists_updated_at
before update on public.grocery_lists
for each row execute function public.set_updated_at();

drop trigger if exists set_grocery_items_updated_at on public.grocery_items;
create trigger set_grocery_items_updated_at
before update on public.grocery_items
for each row execute function public.set_updated_at();

