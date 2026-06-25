-- Development seed data for local or manual Supabase setup.
-- This seed creates a demo auth user first so the auth trigger can bootstrap
-- the matching household and profile automatically.

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_sent_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  is_super_admin
)
values (
  '11111111-1111-1111-1111-111111111111',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'demo@mealplanner.local',
  '$2a$10$CwTycUXWue0Thq9StjUM0uJ8f7R6e7iT7d1Yl6t0Wf4d8f6u1u5Qe',
  now(),
  null,
  null,
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Demo User","household_name":"Demo Household"}'::jsonb,
  now(),
  now(),
  false
)
on conflict (id) do nothing;

-- The auth trigger creates the matching household and profile for the demo user.

insert into public.dishes (id, household_id, name, category, instructions, notes)
values
  ('21111111-1111-1111-1111-111111111111', (select household_id from public.profiles where id = '11111111-1111-1111-1111-111111111111'), 'Stir fry pork', 'protein', null, 'Simple weekday dinner'),
  ('21111111-1111-1111-1111-111111111112', (select household_id from public.profiles where id = '11111111-1111-1111-1111-111111111111'), 'Rice', 'carb', null, null),
  ('21111111-1111-1111-1111-111111111113', (select household_id from public.profiles where id = '11111111-1111-1111-1111-111111111111'), 'Boiled broccoli', 'vegetable', null, null)
on conflict (id) do nothing;

insert into public.dish_ingredients (id, dish_id, name, ingredient_type, sort_order)
values
  ('31111111-1111-1111-1111-111111111111', '21111111-1111-1111-1111-111111111111', 'Pork', 'grocery', 0),
  ('31111111-1111-1111-1111-111111111112', '21111111-1111-1111-1111-111111111111', 'Soy sauce', 'pantry', 1),
  ('31111111-1111-1111-1111-111111111113', '21111111-1111-1111-1111-111111111112', 'Rice', 'grocery', 0),
  ('31111111-1111-1111-1111-111111111114', '21111111-1111-1111-1111-111111111113', 'Broccoli', 'grocery', 0)
on conflict (id) do nothing;

insert into public.meal_combos (id, household_id, name, description)
values (
  '41111111-1111-1111-1111-111111111111',
  (select household_id from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'Pork dinner',
  'Pork, rice, and broccoli'
)
on conflict (id) do nothing;

insert into public.meal_combo_dishes (id, meal_combo_id, dish_id, sort_order)
values
  ('51111111-1111-1111-1111-111111111111', '41111111-1111-1111-1111-111111111111', '21111111-1111-1111-1111-111111111111', 0),
  ('51111111-1111-1111-1111-111111111112', '41111111-1111-1111-1111-111111111111', '21111111-1111-1111-1111-111111111112', 1),
  ('51111111-1111-1111-1111-111111111113', '41111111-1111-1111-1111-111111111111', '21111111-1111-1111-1111-111111111113', 2)
on conflict (id) do nothing;

insert into public.plan_weeks (id, household_id, week_start_date)
values (
  '61111111-1111-1111-1111-111111111111',
  (select household_id from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  current_date
)
on conflict (id) do nothing;

insert into public.cook_batches (id, household_id, meal_combo_id, cooked_date, cooked_meal_type, portions_cooked, notes)
values (
  '71111111-1111-1111-1111-111111111111',
  (select household_id from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  '41111111-1111-1111-1111-111111111111',
  current_date,
  'dinner',
  4,
  'Demo batch with leftovers'
)
on conflict (id) do nothing;

insert into public.meal_slots (id, household_id, plan_week_id, date, meal_type, entry_type, meal_combo_id, cook_batch_id, portions_eaten, notes)
values
  ('81111111-1111-1111-1111-111111111111', (select household_id from public.profiles where id = '11111111-1111-1111-1111-111111111111'), '61111111-1111-1111-1111-111111111111', current_date, 'dinner', 'cook', '41111111-1111-1111-1111-111111111111', null, 2, 'Cooked dinner'),
  ('81111111-1111-1111-1111-111111111112', (select household_id from public.profiles where id = '11111111-1111-1111-1111-111111111111'), '61111111-1111-1111-1111-111111111111', current_date + 1, 'lunch', 'leftover', null, '71111111-1111-1111-1111-111111111111', 2, 'Leftovers for lunch')
on conflict (id) do nothing;

insert into public.grocery_lists (id, household_id, plan_week_id)
values (
  '91111111-1111-1111-1111-111111111111',
  (select household_id from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  '61111111-1111-1111-1111-111111111111'
)
on conflict (id) do nothing;

insert into public.grocery_items (id, grocery_list_id, name, source_type, is_checked, is_manual)
values
  ('a1111111-1111-1111-1111-111111111111', '91111111-1111-1111-1111-111111111111', 'Pork', 'generated', false, false),
  ('a1111111-1111-1111-1111-111111111112', '91111111-1111-1111-1111-111111111111', 'Rice', 'generated', false, false),
  ('a1111111-1111-1111-1111-111111111113', '91111111-1111-1111-1111-111111111111', 'Broccoli', 'generated', false, false)
on conflict (id) do nothing;
