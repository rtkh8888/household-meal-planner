# Household Meal Planner

Mobile-first household meal planner scaffold for the MVP.

## Phase 1 Includes

- Next.js + TypeScript app shell
- Tailwind styling
- Supabase client setup
- Placeholder routes for the core app areas
- Mobile navigation shell
- Basic loading and error states
- Basic PWA manifest and icons

## Phase 2 Includes

- Supabase-ready PostgreSQL schema migrations
- Household bootstrap on first auth signup
- Row Level Security policies for household-owned data
- Development seed data for a demo household
- Typed database model for future Supabase client usage
- Phase 2 smoke test plan in `supabase/phase2_smoke_test_plan.md`
## Getting Started

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
   ```

4. Start the dev server:

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

## Notes

- The homepage redirects to `/dashboard`.
- Missing Supabase environment variables show a clear setup warning in the app shell.
- The schema lives in `supabase/migrations/`.
- Development seed data lives in `supabase/seed.sql`.
- The first auth signup automatically creates a household and profile.



