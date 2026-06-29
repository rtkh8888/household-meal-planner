# Household Meal Planner App ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Implementation Plan

## 0. Product Summary

Build a mobile-first household meal planning web app.

The app helps users:

- Store dishes/recipes.
- Group dishes into reusable meal combos.
- Plan weekly meals.
- Support cooking in batches and eating leftovers.
- Generate a simple grocery list from cooked meals only.
- Exclude pantry staples like soy sauce, oyster sauce, oil, salt, etc.

The MVP is for private household use first, but the codebase should be structured so it can become a public app later.

---

# Core Product Logic

## Key Concept

The app should use this model:

```text
Dish ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ Meal Combo ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ Cook Batch ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ Meal Slot ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ Grocery List
```

## Example Household Workflow

User cooks dinner for 2 people and saves leftovers for lunch.

Example:

```text
Monday dinner:
- Stir fry pork
- Rice
- Boiled broccoli

Cooked portions: 4
Eaten Monday dinner: 2
Leftover assigned to Tuesday lunch: 2
```

The grocery list should count ingredients once from the Monday dinner cook batch.

Tuesday lunch is a leftover meal and should not add duplicate grocery items.

---

# MVP Rules

## Include in MVP

- Dish library
- Dish ingredients
- Pantry staple flag
- Meal combo builder
- Weekly meal planner
- Cook batch creation
- Leftover meal assignment
- Simple grocery list generation
- Grocery item checklist
- Mobile-first responsive UI
- Supabase database
- Basic auth
- Vercel deployment
- Basic PWA support

## Exclude from MVP

- Calories/macros
- Exact ingredient quantities
- AI meal generation
- Recipe import from websites
- Barcode scanning
- Payment/subscription
- Multi-household invite flow
- Complex inventory tracking
- Native iOS/Android app

---

# Recommended Tech Stack

## Frontend

- Next.js
- TypeScript
- React
- Tailwind CSS
- shadcn/ui or simple custom components
- Mobile-first responsive layout

## Backend / Database

- Supabase
- Postgres
- Supabase Auth
- Row Level Security prepared from the start

## Hosting

- Vercel

## App Platform

- Responsive web app
- PWA installable on phone via browser
- Native mobile app is not required for MVP

---

# Suggested Folder Structure

```text
meal-planner-app/
  app/
    login/
    dashboard/
    dishes/
    combos/
    planner/
    grocery/
    settings/
  components/
    layout/
    dishes/
    combos/
    planner/
    grocery/
    ui/
  lib/
    supabase/
    utils/
    planner/
    grocery/
  types/
  supabase/
    migrations/
    seed.sql
  public/
    icons/
  README.md
```

---

# Phase 1 ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Project Setup

## Goal

Create the base Next.js project with TypeScript, Tailwind, Supabase client setup, and clean app structure.

## Tasks

- [x] Create new Next.js project.
- [x] Use TypeScript.
- [x] Install Tailwind CSS.
- [x] Install Supabase client package.
- [x] Set up ESLint/Prettier if not already included.
- [x] Create basic folder structure.
- [x] Create environment variable file template.
- [x] Add `.env.local.example`.
- [x] Add basic app layout.
- [x] Add mobile-first navigation shell.
- [ ] Add placeholder pages:
  - [x] Login
  - [x] Dashboard
  - [x] Dishes
  - [x] Meal Combos
  - [x] Planner
  - [x] Grocery List
  - [x] Settings
- [x] Add simple loading and error states.
- [x] Add README with setup instructions.

## Environment Variables

Create:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Testing Plan

- [x] App starts locally with `npm run dev`.
- [x] No TypeScript errors.
- [x] No lint errors.
- [x] Each placeholder route loads correctly.
- [x] Mobile viewport layout does not break.
- [x] Navigation works between pages.
- [x] Missing env vars show a clear developer error.
- [x] README setup steps are accurate.

## Completion Criteria

Phase is complete when the app runs locally, has a clean mobile-first shell, and all main routes exist as placeholders.

---

# Phase 2 ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Supabase Schema + Database Foundation

## Goal

Create the core database schema to support dishes, ingredients, meal combos, weekly planning, cook batches, leftovers, and grocery lists.

## Database Tables

### 1. households

Stores household-level settings.

Fields:

```text
id uuid primary key
name text not null
default_people_per_meal integer default 2
default_leftover_enabled boolean default true
created_at timestamp
updated_at timestamp
```

---

### 2. profiles

Links Supabase auth users to households.

Fields:

```text
id uuid primary key references auth.users(id)
household_id uuid references households(id)
display_name text
created_at timestamp
updated_at timestamp
```

---

### 3. dishes

Stores individual dishes.

Examples:

- Stir fry pork
- Rice
- Boiled broccoli
- ABC soup
- Steamed egg

Fields:

```text
id uuid primary key
household_id uuid references households(id)
name text not null
category text
instructions text
notes text
created_at timestamp
updated_at timestamp
```

Suggested categories:

```text
protein
vegetable
carb
soup
side
one_pot
breakfast
snack
other
```

---

### 4. dish_ingredients

Stores simple ingredient names for each dish.

No quantity tracking in MVP.

Fields:

```text
id uuid primary key
dish_id uuid references dishes(id) on delete cascade
name text not null
ingredient_type text default 'grocery'
sort_order integer default 0
created_at timestamp
updated_at timestamp
```

Ingredient types:

```text
grocery
pantry
optional
```

Rules:

- grocery = included in generated grocery list
- pantry = excluded by default
- optional = visible but not included unless manually added later

---

### 5. meal_combos

Stores reusable combinations of dishes.

Example:

```text
Pork + Rice + Broccoli
```

Fields:

```text
id uuid primary key
household_id uuid references households(id)
name text not null
description text
created_at timestamp
updated_at timestamp
```

---

### 6. meal_combo_dishes

Join table between meal combos and dishes.

Fields:

```text
id uuid primary key
meal_combo_id uuid references meal_combos(id) on delete cascade
dish_id uuid references dishes(id) on delete cascade
sort_order integer default 0
created_at timestamp
```

---

### 7. plan_weeks

Stores weekly plans.

Fields:

```text
id uuid primary key
household_id uuid references households(id)
week_start_date date not null
created_at timestamp
updated_at timestamp
```

Constraint:

```text
unique(household_id, week_start_date)
```

---

### 8. cook_batches

Stores actual cooking events.

Fields:

```text
id uuid primary key
household_id uuid references households(id)
meal_combo_id uuid references meal_combos(id)
cooked_date date not null
cooked_meal_type text not null
portions_cooked integer not null
notes text
created_at timestamp
updated_at timestamp
```

Meal types:

```text
breakfast
lunch
dinner
snack
```

---

### 9. meal_slots

Stores planned eating events.

A meal slot can be a cooked meal or leftover meal.

Fields:

```text
id uuid primary key
household_id uuid references households(id)
plan_week_id uuid references plan_weeks(id) on delete cascade
date date not null
meal_type text not null
entry_type text not null
meal_combo_id uuid references meal_combos(id)
cook_batch_id uuid references cook_batches(id)
portions_eaten integer default 2
notes text
created_at timestamp
updated_at timestamp
```

Entry types:

```text
cook
leftover
manual
```

Rules:

- cook = user cooked this meal
- leftover = user is eating from an existing cook batch
- manual = placeholder/free-text meal, optional for later

---

### 10. grocery_lists

Stores generated grocery lists for a week.

Fields:

```text
id uuid primary key
household_id uuid references households(id)
plan_week_id uuid references plan_weeks(id) on delete cascade
created_at timestamp
updated_at timestamp
```

Constraint:

```text
unique(household_id, plan_week_id)
```

---

### 11. grocery_items

Stores individual grocery list items.

Fields:

```text
id uuid primary key
grocery_list_id uuid references grocery_lists(id) on delete cascade
name text not null
source_type text default 'generated'
is_checked boolean default false
is_manual boolean default false
created_at timestamp
updated_at timestamp
```

Source types:

```text
generated
manual
pantry_reference
optional
```

---

## RLS / Auth MVP Approach

Use simple household-level access.

For MVP:

- Each user belongs to one household.
- User can only access records linked to their household.
- Avoid public multi-household invite flow for now.
- Seed or create the first household automatically on first login.

## Tasks

- [ ] Create Supabase project.
- [x] Create migration files.
- [x] Create all tables.
- [x] Add updated_at trigger function.
- [x] Add constraints.
- [x] Add indexes for common lookups.
- [x] Enable RLS on household-owned tables.
- [x] Add basic household ownership policies.
- [x] Create seed data for development.
- [x] Add TypeScript database types if using Supabase type generation.
- [x] Document schema in README.

## Testing Plan

- [x] Migrations run successfully.
- [x] Seed data inserts successfully.
- [x] Tables appear correctly in Supabase.
- [x] Foreign key constraints work.
- [x] Deleting a dish deletes related dish ingredients.
- [x] Deleting a meal combo deletes related combo-dish rows.
- [ ] Deleting a plan week deletes related meal slots and grocery list.
- [x] RLS prevents unauthenticated data access.
- [x] Authenticated user can access own household data.
- [ ] Authenticated user cannot access another householdÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢s data.

## Completion Criteria

Phase is complete when database schema is ready, seed data exists, and basic household-level security works.

---

# Phase 3 ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Auth + Household Initialization

## Goal

Allow the user to log in and have a household profile.

## MVP Auth Flow

Use email/password or magic link.

Recommended MVP:

```text
Login ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ create profile if missing ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ create household if missing ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ redirect to dashboard
```

## Tasks

- [x] Build login page.
- [x] Add Supabase auth client.
- [x] Add server/client auth helpers.
- [x] Protect app routes.
- [x] Redirect unauthenticated users to login.
- [x] Create onboarding logic for first login.
- [x] Create default household.
- [x] Create default profile.
- [x] Store household ID in profile.
- [x] Add logout button.
- [x] Add basic settings page to show household settings.
- [x] Allow editing household name.
- [x] Allow editing default people per meal.
- [x] Allow editing default leftover setting.

## Testing Plan

- [ ] New user can sign up.
- [x] Existing user can log in.
- [x] User can log out.
- [x] Protected pages redirect when logged out.
- [x] First login creates household and profile.
- [ ] Returning login does not duplicate household/profile.
- [x] Household settings load correctly.
- [ ] Household settings update correctly.
- [ ] App does not crash if profile is missing.
- [ ] App shows helpful error if Supabase auth fails.

## Completion Criteria

Phase is complete when a user can log in, access the app, and has a usable household context.

---

# Phase 4 ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Dish Library

## Goal

Build CRUD functionality for dishes and ingredients.

## User Stories

```text
As a user, I can create a dish.
As a user, I can add ingredients to a dish.
As a user, I can mark ingredients as grocery, pantry, or optional.
As a user, I can edit/delete dishes.
As a user, I can search/filter my dishes.
```

## UI Requirements

Dish list page:

- Search bar
- Category filter
- Add dish button
- Dish cards
- Ingredient preview
- Pantry indicator

Dish form:

- Dish name
- Category
- Ingredient list
- Ingredient type dropdown
- Instructions
- Notes
- Save/cancel buttons

## Ingredient Type Behavior

```text
grocery ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ included in grocery list
pantry ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ excluded from grocery list by default
optional ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ excluded from grocery list by default
```

## Tasks

- [x] Build dish list page.
- [x] Build add dish form.
- [x] Build edit dish form.
- [x] Build delete dish action.
- [x] Build ingredient add/remove UI.
- [x] Add ingredient type selector.
- [x] Add dish category selector.
- [x] Add search by dish name.
- [x] Add filter by category.
- [x] Add empty state.
- [x] Add loading state.
- [x] Add error state.
- [x] Add confirmation before deleting dish.
- [x] Prevent creating dish with empty name.
- [x] Prevent creating duplicate empty ingredients.
- [x] Trim whitespace from ingredient names.

## Testing Plan

- [x] User can create dish with ingredients.
- [x] User can create dish without instructions.
- [x] User cannot create dish without name.
- [x] User can mark ingredient as pantry.
- [x] User can mark ingredient as grocery.
- [x] User can edit dish name.
- [x] User can edit ingredient list.
- [x] User can delete ingredient.
- [x] User can delete dish.
- [x] Search returns expected dishes.
- [x] Category filter works.
- [x] Empty state appears when no dishes exist.
- [x] Long dish names do not break mobile UI.
- [ ] RLS prevents access to another household's dishes.
## Completion Criteria

Phase is complete when dishes can be fully created, edited, searched, filtered, and deleted.

---

# Phase 5 Meal Combo Builder

## Goal

Allow users to create reusable meal combos made of multiple dishes.

## Example Meal Combo

```text
Name: Pork + Rice + Broccoli

Dishes:
- Stir fry pork
- Rice
- Boiled broccoli
```

## User Stories

```text
As a user, I can create a meal combo from existing dishes.
As a user, I can reuse a meal combo in the weekly planner.
As a user, I can edit/delete meal combos.
```

## UI Requirements

Meal combo list:

- Combo cards
- Dishes shown inside each combo
- Add combo button
- Edit/delete actions

Meal combo form:

- Combo name
- Optional description
- Multi-select dish picker
- Sortable dish order if simple to implement
- Save/cancel buttons

## Tasks

- [x] Build meal combo list page.
- [x] Build add meal combo form.
- [x] Build edit meal combo form.
- [x] Build delete meal combo action.
- [x] Add dish multi-select.
- [x] Show selected dishes in combo preview.
- [x] Allow removing dish from combo.
- [x] Prevent creating combo without name.
- [x] Prevent creating combo with no dishes.
- [x] Show empty state if no dishes exist.
- [x] Add quick link to create dish from combo page.

## Testing Plan

- [x] User can create combo with multiple dishes.
- [x] User cannot create combo without name.
- [x] User cannot create combo with zero dishes.
- [x] User can edit combo name.
- [x] User can add dish to existing combo.
- [x] User can remove dish from existing combo.
- [x] User can delete combo.
- [x] Deleted combo does not delete original dishes.
- [x] Combo list displays dish names correctly.
- [ ] Mobile UI handles 3-5 dishes per combo.
- [ ] RLS prevents access to another household's combos.

## Completion Criteria

Phase is complete when users can create and manage reusable meal combos.

---

# Phase 6 Weekly Planner + Cook Batch + Leftovers

## Goal

Build the weekly planner where users assign meals to dates and meal slots.

The planner must support cooking once and eating leftovers later.

## Core Planner Flow

When user adds a meal:

```text
1. Select date and meal type.
2. Select meal combo.
3. Choose portions cooked.
4. Choose portions eaten now.
5. Optionally assign remaining portions to the next meal slot.
6. App creates:
   - one cook batch
   - one cook meal slot
   - optional leftover meal slot
```

## Default Household Logic

For this userÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢s household:

```text
default_people_per_meal = 2
default_leftover_enabled = true
```

Default behavior:

```text
Cook dinner for 4 portions.
Eat 2 portions for dinner.
Assign 2 portions to next day lunch.
```

But do not hardcode this. Use household settings.

## Meal Slot Types

```text
cook:
  User cooked this meal.
  Connected to a cook batch.
  Adds grocery ingredients.

leftover:
  User eats from previous cook batch.
  Does not add grocery ingredients.

manual:
  Optional future feature.
  Used for eating out or ad-hoc meals.
```

## UI Requirements

Weekly planner page:

- Week selector
- Previous/next week controls
- Today shortcut
- 7-day view
- Meal slots per day:
  - breakfast
  - lunch
  - dinner
- Add meal button per slot
- Slot card showing:
  - meal combo name
  - dishes
  - entry type: Cook / Leftover
  - portions eaten
- Delete meal slot
- Edit meal slot if simple

Add meal modal:

- Date
- Meal type
- Meal combo
- Portions cooked
- Portions eaten now
- Checkbox: assign leftovers
- Leftover target date
- Leftover target meal type
- Save

## Leftover Assignment Logic

If:

```text
portions_cooked > portions_eaten
```

Then:

```text
leftover_portions = portions_cooked - portions_eaten
```

If user enables leftover assignment, create a leftover meal slot linked to the same cook batch.

Example:

```text
Cook batch:
  meal combo = Pork + Rice + Broccoli
  portions cooked = 4

Monday dinner meal slot:
  entry type = cook
  portions eaten = 2
  cook_batch_id = same batch

Tuesday lunch meal slot:
  entry type = leftover
  portions eaten = 2
  cook_batch_id = same batch
```

## Helper Functions Needed

Create utility functions:

```text
getWeekStart(date)
getWeekDays(weekStartDate)
getNextMealSlot(date, mealType)
calculateLeftoverPortions(portionsCooked, portionsEaten)
createCookMealWithOptionalLeftover(input)
```

Suggested next meal slot logic:

```text
breakfast ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ lunch same day
lunch ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ dinner same day
dinner ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ lunch next day
```

For this household, dinner should default to next day lunch.

## Tasks

- [ ] Build week selector.
- [ ] Build weekly planner layout.
- [ ] Build meal slot cards.
- [ ] Build add meal modal.
- [ ] Load meal combos into modal.
- [ ] Create or fetch plan week by week start date.
- [ ] Create cook batch when adding cooked meal.
- [ ] Create cook meal slot.
- [ ] Create optional leftover meal slot.
- [ ] Link leftover slot to original cook batch.
- [ ] Prevent accidental duplicate leftover slot without warning.
- [ ] Allow deleting meal slot.
- [ ] If deleting cook slot, decide behavior:
  - MVP: delete cook slot only, keep cook batch if leftover exists.
  - If no other slots use cook batch, delete cook batch.
- [ ] Display whether a meal is cooked or leftover.
- [ ] Display portions eaten.
- [ ] Add empty state for each meal slot.
- [ ] Add loading/error states.

## Testing Plan

- [ ] User can select current week.
- [ ] User can move to previous week.
- [ ] User can move to next week.
- [ ] User can add cooked dinner.
- [ ] App creates cook batch.
- [ ] App creates cook meal slot.
- [ ] App creates leftover slot when enabled.
- [ ] Leftover slot links to same cook batch.
- [ ] Dinner defaults leftover target to next day lunch.
- [ ] User can disable leftover assignment.
- [ ] If no leftover is assigned, no leftover slot is created.
- [ ] User can delete meal slot.
- [ ] Deleting leftover does not delete original cook batch.
- [ ] Planner displays meal combo dishes correctly.
- [ ] Planner handles empty days.
- [ ] Planner works on mobile viewport.
- [ ] RLS prevents access to another householdÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢s planner data.

## Completion Criteria

Phase is complete when weekly planning supports cooked meals and linked leftovers.

---

# Phase 7 ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Grocery List Generation

## Goal

Generate a simple weekly grocery list based only on cooked meals/cook batches.

Leftover meals should not duplicate ingredients.

## Grocery Generation Rule

Generate grocery list from:

```text
cook meal slots / cook batches
```

Do not generate from:

```text
leftover meal slots
```

## Ingredient Inclusion Rule

```text
grocery ingredients ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ include
pantry ingredients ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ exclude from main grocery list
optional ingredients ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ exclude from main grocery list
```

## Pantry Reference Section

Add a secondary section:

```text
Pantry staples used this week
```

This shows pantry items from planned cooked meals, but does not add them to the main shopping checklist.

Example:

Main grocery list:

```text
- Pork
- Broccoli
- Garlic
- Rice
```

Pantry staples used this week:

```text
- Soy sauce
- Oyster sauce
- Oil
```

## Deduplication Rule

Deduplicate grocery items by normalized ingredient name.

Normalization:

```text
trim whitespace
lowercase
collapse repeated spaces
```

Example:

```text
"Broccoli"
" broccoli "
"broccoli"
```

Should become one item:

```text
Broccoli
```

## Regeneration Behavior

When user clicks ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“Generate Grocery ListÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â:

- Get all cook batches for the selected week.
- Get all dishes in each batchÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢s meal combo.
- Get all ingredients for those dishes.
- Include grocery ingredients.
- Exclude pantry and optional ingredients.
- Deduplicate by normalized name.
- Create/update grocery list.
- Preserve manually added grocery items.
- Preserve checked state when possible by matching normalized name.

## UI Requirements

Grocery page:

- Week selector
- Generate/update grocery list button
- Grocery checklist
- Check/uncheck item
- Add manual item
- Delete item
- Pantry staples used this week section
- Empty state

## Tasks

- [ ] Build grocery page.
- [ ] Add week selector.
- [ ] Build grocery generation service.
- [ ] Fetch cook meal slots for week.
- [ ] Fetch related cook batches.
- [ ] Fetch related meal combos.
- [ ] Fetch dishes and ingredients.
- [ ] Include only grocery ingredients in main list.
- [ ] Deduplicate ingredients.
- [ ] Create grocery list if missing.
- [ ] Insert generated grocery items.
- [ ] Preserve manual grocery items.
- [ ] Preserve checked state by ingredient name where possible.
- [ ] Add manual grocery item.
- [ ] Check/uncheck grocery item.
- [ ] Delete grocery item.
- [ ] Show pantry staples used this week.
- [ ] Add loading state.
- [ ] Add error state.
- [ ] Add success toast after generation.

## Testing Plan

- [ ] Grocery list generates from cooked meals.
- [ ] Grocery list does not generate from leftover meals.
- [ ] Same ingredient across multiple dishes appears once.
- [ ] Pantry items are excluded from main grocery list.
- [ ] Pantry items appear in pantry reference section.
- [ ] Optional ingredients are excluded from main grocery list.
- [ ] Manual grocery item can be added.
- [ ] Manual grocery item remains after regeneration.
- [ ] Checked generated item remains checked after regeneration if still present.
- [ ] Deleted generated item behavior is acceptable for MVP.
- [ ] Empty plan shows empty grocery state.
- [ ] Grocery list works on mobile.
- [ ] RLS prevents access to another householdÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢s grocery list.

## Completion Criteria

Phase is complete when the grocery list accurately reflects cooked meals only and excludes pantry staples by default.

---

# Phase 8 ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Dashboard + User Experience Polish

## Goal

Make the app feel usable as a real household tool.

## Dashboard Should Show

- Current week summary
- TodayÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢s meals
- TomorrowÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢s planned meals
- Quick actions:
  - Add dish
  - Add meal combo
  - Plan this week
  - View grocery list

## UX Improvements

- Toast notifications
- Empty states
- Confirmation dialogs
- Mobile spacing polish
- Better button labels
- Basic skeleton loaders
- Friendly error messages

## Tasks

- [ ] Build dashboard page.
- [ ] Show todayÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢s meals.
- [ ] Show tomorrowÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢s meals.
- [ ] Show current week planned meal count.
- [ ] Add quick action buttons.
- [ ] Improve empty states across app.
- [ ] Add confirmation dialog for destructive actions.
- [ ] Add toast notifications.
- [ ] Improve mobile layout.
- [ ] Improve form validation messages.
- [ ] Add app title and favicon.
- [ ] Add basic app icon assets.

## Testing Plan

- [ ] Dashboard loads without planned meals.
- [ ] Dashboard loads with planned meals.
- [ ] TodayÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢s meals are accurate.
- [ ] TomorrowÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢s meals are accurate.
- [ ] Quick action buttons navigate correctly.
- [ ] Empty states are helpful.
- [ ] Toasts appear after successful actions.
- [ ] Delete confirmations appear before deletion.
- [ ] Mobile UI is usable with one hand.
- [ ] No horizontal scrolling on mobile.

## Completion Criteria

Phase is complete when the app feels usable for daily household planning.

---

# Phase 9 ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â PWA + Mobile Installability

## Goal

Make the web app installable on mobile as a PWA.

## MVP PWA Scope

Keep this simple.

Include:

- Web app manifest
- App name
- App icons
- Theme color
- Mobile viewport metadata
- Basic installability support

Offline support is optional and should not be prioritized in MVP.

## Tasks

- [ ] Add web app manifest.
- [ ] Add app icons.
- [ ] Add theme color.
- [ ] Add viewport config.
- [ ] Add mobile-friendly metadata.
- [ ] Test Add to Home Screen on iPhone.
- [ ] Test app launch from home screen.
- [ ] Ensure layout works in standalone display mode.
- [ ] Add README note on installing as PWA.

## Testing Plan

- [ ] Manifest is valid.
- [ ] Icons load correctly.
- [ ] App can be added to phone home screen.
- [ ] App opens from home screen.
- [ ] App does not show broken layout in standalone mode.
- [ ] Auth session works after reopening app.
- [ ] Navigation works on mobile.
- [ ] Grocery checklist is usable on mobile.

## Completion Criteria

Phase is complete when the app can be used like a lightweight mobile app from the phone home screen.

---

# Phase 10 ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Deployment

## Goal

Deploy the app publicly but keep user data private.

## Tasks

- [ ] Create production Supabase project or configure existing project.
- [ ] Run production migrations.
- [ ] Configure production environment variables in Vercel.
- [ ] Deploy app to Vercel.
- [ ] Confirm auth redirect URLs.
- [ ] Confirm Supabase RLS is enabled in production.
- [ ] Confirm app works on production URL.
- [ ] Add deployment instructions to README.
- [ ] Add screenshots to README.
- [ ] Add portfolio description section.

## Testing Plan

- [ ] Production app loads.
- [ ] Login works in production.
- [ ] Logout works in production.
- [ ] User can create dish in production.
- [ ] User can create meal combo in production.
- [ ] User can create weekly plan in production.
- [ ] User can assign leftovers in production.
- [ ] User can generate grocery list in production.
- [ ] Pantry staples are excluded in production.
- [ ] Mobile layout works from production URL.
- [ ] RLS works in production.
- [ ] No secret keys are exposed in GitHub.
- [ ] Vercel build passes.
- [ ] README contains correct live demo instructions.

## Completion Criteria

Phase is complete when the app is live, secure, and usable from phone/laptop.

---

# Phase 11 ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Portfolio Readiness

## Goal

Make the project presentable for resume, GitHub, and interviews.

## README Should Include

- Project overview
- Problem statement
- Core features
- Tech stack
- Screenshots
- Database model summary
- Key product logic
- What was intentionally excluded from MVP
- Future improvements
- Local setup instructions
- Deployment instructions

## Portfolio Positioning

Suggested project description:

```text
Built a mobile-first household meal planning web app using Next.js, Supabase, and Vercel.

The app supports reusable dish libraries, meal combos, weekly planning, cook batches, leftover tracking, and grocery list generation. The core logic prevents leftover meals from double-counting grocery ingredients and excludes pantry staples by default.
```

## Resume Bullet Ideas

```text
Built a full-stack meal planning web app with Next.js, Supabase, and Vercel, enabling users to manage dishes, meal combos, weekly plans, leftovers, and grocery lists.
```

```text
Designed relational data model for household meal planning, including dishes, ingredients, meal combos, cook batches, meal slots, and grocery list generation.
```

```text
Implemented grocery generation logic that deduplicates ingredients, excludes pantry staples, and prevents leftover meals from double-counting shopping items.
```

## Tasks

- [ ] Write complete README.
- [ ] Add screenshots.
- [ ] Add architecture diagram if possible.
- [ ] Add database schema summary.
- [ ] Add future roadmap.
- [ ] Add sample seed data.
- [ ] Add resume bullets.
- [ ] Add live demo link.
- [ ] Clean up unused code.
- [ ] Ensure project can be cloned and run by another developer.

## Testing Plan

- [ ] Fresh clone can run locally from README instructions.
- [ ] Environment variable setup is clear.
- [ ] Screenshots match current UI.
- [ ] Demo link works.
- [ ] Resume bullets accurately describe the project.
- [ ] No private household data appears in README/screenshots.
- [ ] No secrets committed.

## Completion Criteria

Phase is complete when the project is polished enough to show on GitHub or discuss in an interview.

---

# Phase 12 ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Future Public App Readiness

Do not build these in MVP unless specifically requested later.

## Future Features

- Multi-household support
- Invite spouse/family member
- Exact ingredient quantity tracking
- Serving-size scaling
- Recipe import from URL
- AI dish creation from pasted recipe
- AI weekly meal suggestions
- Pantry inventory tracking
- Expiry tracking
- Meal prep mode
- Nutrition/macros
- Public recipe templates
- Shared grocery list sync
- WhatsApp grocery export
- Calendar integration
- Shopping categories
- Price/budget tracking

## Future Monetization Possibilities

- Free personal plan
- Paid household plan
- Premium AI meal planning
- Recipe import and auto-structuring
- Family/shared planning
- Nutrition-oriented version
- Niche version for gym/fitness meal prep

---

# Important Developer Notes

## Do Not Overbuild

The MVP should solve this exact problem first:

```text
We cook dinner for 2 people, make 4 portions, eat 2 portions tonight, save 2 portions for tomorrow lunch, and want a simple grocery list.
```

## Main Logic To Protect

The most important business rule:

```text
Grocery list is generated from cook batches/cooked meal slots only.
Leftover meal slots must not add ingredients again.
```

## Pantry Rule

The second most important business rule:

```text
Pantry staples stay inside dish ingredients but are excluded from the grocery list by default.
```

## MVP Simplicity Rule

Do not implement exact ingredient quantities yet.

Use simple ingredient names first.

## Preferred Development Order

Build in this order:

```text
1. Project setup
2. Database schema
3. Auth/household setup
4. Dish library
5. Meal combos
6. Weekly planner
7. Cook batch + leftovers
8. Grocery generation
9. Mobile/PWA polish
10. Deployment
11. Portfolio README
```

---

# Final MVP Acceptance Test

The MVP is successful when this full scenario works:

```text
1. User logs in.
2. User creates dish: Stir fry pork.
3. User adds ingredients:
   - Pork: grocery
   - Garlic: grocery
   - Soy sauce: pantry
   - Oyster sauce: pantry

4. User creates dish: Rice.
5. User adds ingredient:
   - Rice: grocery

6. User creates dish: Boiled broccoli.
7. User adds ingredient:
   - Broccoli: grocery

8. User creates meal combo:
   - Pork + Rice + Broccoli

9. User goes to weekly planner.
10. User adds this combo to Monday dinner.
11. User sets:
    - portions cooked: 4
    - portions eaten: 2
    - assign leftovers: yes
    - leftover target: Tuesday lunch

12. App creates:
    - Monday dinner cook meal
    - Tuesday lunch leftover meal

13. User generates grocery list.

14. Grocery list shows:
    - Pork
    - Garlic
    - Rice
    - Broccoli

15. Grocery list does not show:
    - Soy sauce
    - Oyster sauce

16. Pantry staples section shows:
    - Soy sauce
    - Oyster sauce

17. Tuesday lunch does not duplicate ingredients.

18. User can check off grocery items on phone.
```

When this scenario works end-to-end, the MVP is complete.



