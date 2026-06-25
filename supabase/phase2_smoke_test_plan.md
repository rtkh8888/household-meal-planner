# Phase 2 Smoke Test Plan

Run these checks after the migration has been applied to your Supabase project.

## 1. Verify tables exist

Run in the Supabase SQL editor:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

Expected tables:
- `households`
- `profiles`
- `dishes`
- `dish_ingredients`
- `meal_combos`
- `meal_combo_dishes`
- `plan_weeks`
- `cook_batches`
- `meal_slots`
- `grocery_lists`
- `grocery_items`

## 2. Verify seed data inserts

Run:

```sql
select count(*) from public.households;
select count(*) from public.profiles;
select count(*) from public.dishes;
select count(*) from public.dish_ingredients;
select count(*) from public.meal_combos;
select count(*) from public.meal_combo_dishes;
select count(*) from public.plan_weeks;
select count(*) from public.cook_batches;
select count(*) from public.meal_slots;
select count(*) from public.grocery_lists;
select count(*) from public.grocery_items;
```

Expected result: each table should have at least one row from the demo seed.

## 3. Verify foreign keys and cascades

### Dish ingredients cascade

```sql
begin;

insert into public.dishes (household_id, name)
values ((select id from public.households limit 1), 'Temp dish')
returning id;

-- use the returned id in the next statement
insert into public.dish_ingredients (dish_id, name)
values ('REPLACE_WITH_DISH_ID', 'Temp ingredient');

delete from public.dishes where id = 'REPLACE_WITH_DISH_ID';

select count(*)
from public.dish_ingredients
where dish_id = 'REPLACE_WITH_DISH_ID';

rollback;
```

Expected result: ingredient count is `0` after delete.

### Meal combo cascade

```sql
begin;

insert into public.meal_combos (household_id, name)
values ((select id from public.households limit 1), 'Temp combo')
returning id;

insert into public.meal_combo_dishes (meal_combo_id, dish_id)
values ('REPLACE_WITH_COMBO_ID', (select id from public.dishes limit 1));

delete from public.meal_combos where id = 'REPLACE_WITH_COMBO_ID';

select count(*)
from public.meal_combo_dishes
where meal_combo_id = 'REPLACE_WITH_COMBO_ID';

rollback;
```

Expected result: join rows are deleted.

### Plan week cascade

```sql
begin;

insert into public.plan_weeks (household_id, week_start_date)
values ((select id from public.households limit 1), current_date + 14)
returning id;

insert into public.meal_slots (household_id, plan_week_id, date, meal_type, entry_type, meal_combo_id)
values (
  (select id from public.households limit 1),
  'REPLACE_WITH_WEEK_ID',
  current_date + 14,
  'dinner',
  'cook',
  (select id from public.meal_combos limit 1)
);

insert into public.grocery_lists (household_id, plan_week_id)
values ((select id from public.households limit 1), 'REPLACE_WITH_WEEK_ID');

delete from public.plan_weeks where id = 'REPLACE_WITH_WEEK_ID';

select count(*) from public.meal_slots where plan_week_id = 'REPLACE_WITH_WEEK_ID';
select count(*) from public.grocery_lists where plan_week_id = 'REPLACE_WITH_WEEK_ID';

rollback;
```

Expected result: both counts are `0` after delete.

## 4. Verify updated_at trigger

Run:

```sql
select id, updated_at from public.dishes limit 1;

update public.dishes
set notes = coalesce(notes, '') || ' updated'
where id = (select id from public.dishes limit 1)
returning id, updated_at;
```

Expected result: `updated_at` changes after the update.

## 5. Verify RLS behavior

Use a logged-out browser session or the SQL editor without a JWT to confirm anonymous access is blocked.

Expected result:
- Anonymous users cannot read household-owned tables.
- Logged-in users can read only rows for their own household.
- Logged-in users cannot read another household's data.

If you want to test cross-user isolation in the SQL editor, create two test users in the app, then compare access from each authenticated session.

## 6. Recommended app-level smoke checks

After the schema is live:

- Sign in with a new user.
- Confirm the trigger creates a household and profile.
- Open dishes, combos, planner, and grocery routes.
- Confirm the app does not crash if the household starts empty.

## Pass Criteria

Phase 2 is ready when:
- The migration applies cleanly.
- Seed data is present.
- Cascades behave correctly.
- RLS blocks unauthorized access.
- A signed-in user only sees their own household data.
