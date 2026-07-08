# Household Meal Planner

A mobile-first household meal planning web app built with Next.js, Supabase, and Vercel.

The app supports reusable dish libraries, meal combos, weekly planning, cook batches, leftover tracking, and grocery list generation. Its core logic prevents leftover meals from double-counting grocery ingredients and excludes pantry staples by default.

## Project Overview

Household Meal Planner helps a household decide what to cook, what to eat later, and what to buy next. Instead of treating meal planning as a one-off weekly task, the app keeps the workflow connected across:

- dish creation
- reusable meal combos
- weekly planning
- leftover assignment
- grocery generation
- pantry staple exclusion

The app is designed to feel calm, mobile-friendly, and practical for daily use.

## Problem Statement

Meal planning often breaks down because the workflow is split across multiple disconnected tools:

- recipes live in one place
- weekly plans live in another
- leftovers are tracked informally
- grocery lists have to be rebuilt manually

This project solves that by connecting the full flow in one household-aware app.

## Core Features

- Reusable dish library with ingredients and instructions
- Ingredient types for grocery, pantry, and optional items
- Meal combos made from one or more dishes
- Weekly planner with cook meals and linked leftovers
- Leftover tracking tied back to the original cook batch
- Grocery list generation from the weekly plan
- Pantry staples separated from the main grocery checklist
- Manual grocery list items
- Household-scoped authentication and data access
- Mobile-first layout with a clean consumer-app style

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase PostgreSQL
- Supabase Row Level Security
- Vercel-ready deployment

## Database Model Summary

The Supabase schema is organized around a household-owned workflow:

- `households` - household settings and defaults
- `profiles` - auth user profile linked to a household
- `dishes` - reusable dish records
- `dish_ingredients` - ingredient rows for each dish
- `meal_combos` - reusable sets of dishes
- `meal_combo_dishes` - many-to-many join between combos and dishes
- `plan_weeks` - weekly planner anchor rows
- `cook_batches` - cooked meal batches used for leftovers
- `meal_slots` - planned meal entries for the week
- `grocery_lists` - generated grocery lists per week
- `grocery_items` - checklist items, including manual and pantry-related items

Row Level Security keeps all data scoped to the signed-in user's household.

## Key Product Logic

### Leftovers stay linked

Cooked meals create a cook batch. Leftover meals reference that batch instead of acting like separate meals. This keeps the original cook meal and its remaining portions connected.

### Grocery generation avoids double counting

The grocery list is built from planned cooked meals, not from leftover meals again. That prevents ingredients from being counted twice.

### Pantry staples are excluded from the main checklist

Ingredients marked as pantry staples are separated from the main shopping list so the checklist stays focused on actual grocery items.

### Household-wide defaults

The app stores household defaults such as:

- default people per meal
- whether leftovers are enabled by default

These defaults help keep planning fast and consistent.

## What Was Intentionally Excluded From MVP

- Calorie tracking and macros
- Recipe import from external sites
- AI-generated meal suggestions
- Nutrition analysis
- Payment or subscription features
- Multi-household collaboration
- Chat or messaging features
- Native mobile app support

## Future Improvements

- Screenshot-based onboarding
- Smarter grocery grouping by store section
- Calendar export support
- Better analytics for meal usage and leftovers
- Shopping reminders and notifications
- More flexible household preference settings
- Search and filtering improvements for large dish libraries

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your local environment file:

   ```bash
   copy .env.local.example .env.local
   ```

3. Fill in your Supabase values:

   ```text
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   NEXT_PUBLIC_APP_URL=
   ```

   `NEXT_PUBLIC_APP_URL` should point to the real app URL that receives auth confirmation and magic-link callbacks.
   Use your deployed URL or local tunnel URL when testing sign-in flows.

4. Run the development server:

   ```bash
   npm run dev
   ```

5. Open the app:

   - `http://localhost:3000/dashboard`
   - `http://localhost:3000/dishes`
   - `http://localhost:3000/combos`
   - `http://localhost:3000/planner`
   - `http://localhost:3000/grocery`
   - `http://localhost:3000/settings`

## Deployment

This project is ready to deploy on Vercel.

### Deploy steps

1. Push the repository to GitHub.
2. Import the project into Vercel.
3. Add these environment variables in Vercel:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL`

4. Run the Supabase migrations against your production database.
5. Add your production auth callback URL in Supabase Auth Redirect URLs.

### Deployment notes

- The homepage redirects to `/dashboard`.
- Supabase auth callbacks use `/auth/callback`.
- The schema lives in `supabase/migrations/`.
- Demo seed data lives in `supabase/seed.sql`.
- The first auth signup automatically creates a household and profile.

## Development Notes

- Missing Supabase environment variables show a clear configuration error.
- The app uses household-scoped access control through Supabase RLS.
- The interface is mobile-first and intentionally simple to scan on a phone.

## License

No license has been specified yet.


