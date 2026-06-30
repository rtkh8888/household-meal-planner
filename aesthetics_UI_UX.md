# UI/UX Enhancement Instructions â€” Household Meal Planner App

## Role

Act as an expert product designer and frontend engineer.

Improve the aesthetics, layout, and user experience of the existing Household Meal Planner app.

Do not rewrite the whole app. Keep the existing core functionality and data logic intact. Focus on making the app feel warmer, more polished, more mobile-friendly, and easier to use.

---

# Design Direction

## Target Style

Use a visual style that feels like:

```text
Soft Notion-style pastel productivity app + subtle Japanese/Korean cozy kitchen app
```

The app should feel:

- Warm
- Cozy
- Calm
- Slightly cute
- Household-friendly
- Girly/pastel, but not childish
- Clean enough to still look portfolio-worthy

Avoid:

- Harsh white dashboard feel
- Corporate/admin panel look
- Neon colours
- Overly childish cartoon UI
- Cramped grids
- Excessive borders
- Large empty whitespace

---

# Aesthetic System

## Colour Palette

Implement a soft muted pastel design system using CSS variables or Tailwind theme tokens.

Suggested palette:

```text
Background: #FFF8F0 or #FAF4EA
Surface/Card: #FFFFFF or #FFFCF7
Primary: #E9A6B3 soft blush pink
Primary Hover: #DD8FA0
Secondary: #A8CBB7 sage green
Accent: #F3DFA2 butter yellow
Muted Accent: #EDE6DA warm beige
Text Primary: #2F2A26 warm charcoal
Text Secondary: #7A6F66 soft brown/grey
Border: #E6DCD0 soft beige
Danger: #D96B7C soft rose red
Success: #7DAA8B muted green
```

Use warm off-white backgrounds instead of pure white.

## Typography

Use a friendly, readable sans-serif.

Recommendations:

- Keep current font if already using system font.
- Otherwise use a clean rounded font such as `Inter`, `Nunito Sans`, or `Geist`.
- Reduce overly wide letter-spacing except for small labels.

Use hierarchy:

- Page title: larger, warmer, less harsh.
- Section labels: small uppercase, but softer and less spaced out.
- Body text: readable, medium contrast.
- Buttons: friendly but not oversized.

## Corners and Shadows

Use:

```text
Border radius: 16pxâ€“24px for cards
Buttons: rounded-full or 14px+
Cards: soft shadow, not harsh
Borders: subtle warm beige
```

Suggested card style:

```text
background: warm white
border: 1px solid soft beige
box-shadow: 0 8px 24px rgba(80, 60, 40, 0.06)
```

## Logo and Background Pattern

Add a simple cute kitchen/cooking logo.

Suggested logo concept:

```text
A small rice bowl or cooking pot with heart-shaped steam.
```

Use either:

- Inline SVG
- Lucide icons combined creatively
- Simple CSS/SVG logo

Add a subtle repeating background pattern using low-opacity kitchen icons.

Pattern ideas:

- Pot
- Rice bowl
- Spoon
- Carrot
- Egg
- Heart steam

Important:

```text
The background pattern must be very subtle, around 3%â€“7% opacity.
It must never reduce readability.
Do not use a large obvious logo repeated everywhere.
```

---

# Global Layout Improvements

## Current Problem

The app currently feels like a wide desktop admin dashboard. It has large empty areas, narrow planner columns, and heavy scrolling inside forms.

## Required Improvements

- Make the app mobile-first.
- On desktop, keep things spacious but not empty.
- Use a max-width content container, around `1200px`.
- Add consistent page padding.
- Replace hard grid layouts with responsive cards.
- Improve vertical rhythm between sections.
- Make forms feel lighter and less box-heavy.

## Header / Navigation

Current nav buttons are functional but feel slightly generic.

Improve header:

- Add logo + app name on the left.
- Use softer nav pills.
- Highlight active route.
- On mobile, use either:
  - collapsible top nav, or
  - bottom tab navigation for main pages.

Main nav items:

```text
Home
Dishes
Combos
Plan
Groceries
Settings
```

Logout should be visually secondary and separated from main navigation.

Recommended mobile nav:

```text
Bottom tab bar:
Home | Dishes | Plan | Groceries | Settings
```

Combos can be accessed from Dishes or included if space allows.

---

# Page 1 â€” Dishes Page UX Redesign

## Current Problem

Adding ingredients currently requires too much scrolling because each ingredient is a large row/card with input, type dropdown, remove button, and helper text.

## Required Change

Replace the current ingredient entry experience with a faster bulk-input and chip-based workflow.

## New Dish Form UX

The dish form should include:

```text
Dish Name
Category
Ingredients
Instructions
```

## Ingredient Entry

Add a bulk ingredient input area:

```text
Textarea placeholder:
Add ingredients, one per line...

Example:
Pork
Garlic
Broccoli
Soy sauce
Oyster sauce
```

Add button:

```text
Convert to ingredients
```

When clicked, convert each line into ingredient chips/rows.

## Ingredient Chips

Each ingredient should appear as a compact chip/card.

Each chip should show:

- Ingredient name
- Type selector or segmented control:
  - Grocery
  - Pantry
  - Optional
- Remove icon/button

Default type:

```text
Grocery
```

Visual style:

```text
Grocery = sage green chip
Pantry = beige/butter chip
Optional = blush/light pink chip
```

Do not use large repeated input boxes for each ingredient unless editing is needed.

## Pantry Quick Add

Add a â€œCommon pantry staplesâ€ section with quick-add buttons:

```text
Soy sauce
Oyster sauce
Oil
Salt
Pepper
Sugar
Sesame oil
Cornstarch
Vinegar
Garlic powder
```

When clicked, these should be added as `Pantry` ingredients by default.

## Dish List Area

Current left side has search/category but lots of empty space.

Improve it by showing actual dish cards below search/filter.

Dish card should show:

- Dish name
- Category badge
- Ingredient count
- Small preview of ingredients
- Edit action

On mobile:

- Search/filter at top
- Dish cards below
- Add/edit form can appear as a modal or separate page section

## Dish Page Acceptance Criteria

- [x] User can add multiple ingredients quickly using line-by-line input.
- [x] User can mark ingredients as Grocery/Pantry/Optional without excessive scrolling.
- [x] User can quick-add pantry staples.
- [x] Dish list does not leave a large empty panel.
- [x] Page feels usable on phone and laptop.
- [x] Existing dish CRUD logic remains intact.

---

# Page 2 â€” Weekly Planner UX Redesign

## Current Problem

The current 7-day planner with breakfast/lunch/dinner columns creates very narrow vertical tubes. Once dishes are added, the layout looks cramped and ugly.

## Required Change

Replace the cramped 7-column layout with a day-focused planner.

## Planner Default

By default, show only:

```text
Lunch
Dinner
```

Breakfast should be optional and hidden by default.

Add setting or simple toggle:

```text
Show breakfast
```

## Mobile Layout

Use this structure:

```text
This Week
[Mon] [Tue] [Wed] [Thu] [Fri] [Sat] [Sun]

Selected Day: Monday, Jul 1

Lunch
[Meal slot card]

Dinner
[Meal slot card]
```

Use horizontally scrollable day pills/tabs at the top.

Each day tab should show:

- Day name
- Date
- Small dot/count if meals are planned

Example:

```text
Mon
1
â€¢ 2 meals
```

## Desktop Layout

On larger screens, use either:

Option A:

```text
Day tabs + selected day detail
```

or Option B:

```text
Responsive 2â€“3 column day cards
```

Do not use a 7-column grid if it causes narrow meal cards.

Recommended desktop approach:

```text
Use responsive day cards:
- 1 column mobile
- 2 columns tablet
- 3 columns desktop
```

Each day card contains Lunch and Dinner.

## Meal Slot Card Design

Cooked meal card should show:

```text
Dinner
Cooked meal

Pork + Rice + Broccoli

4 portions cooked
2 eaten now
Leftover planned for Tue lunch
```

Leftover meal card should show:

```text
Lunch
Leftover

Pork + Rice + Broccoli

From Mon dinner
2 portions
```

Use visual badges:

```text
Cook
Leftover
Manual
4 portions
```

Suggested icons:

- Cook: pot/pan icon
- Leftover: lunchbox icon
- Grocery: shopping basket icon

Use Lucide icons if available.

## Add Meal Flow

Improve the add meal modal.

Fields:

```text
Meal type: Lunch/Dinner
Meal combo
Portions cooked
Portions eaten now
Assign leftovers toggle
Leftover target date
Leftover target meal
```

Defaults:

```text
People per meal: 2
Cooked portions: 4
Eaten now: 2
Assign leftovers: true
Dinner leftover target: next day lunch
```

Make the form compact and easy to use.

## Planner Acceptance Criteria

- [x] No cramped 7-column tube layout.
- [x] Lunch and Dinner are visible by default.
- [x] Breakfast is optional/hidden by default.
- [x] Planner works nicely on mobile.
- [x] Meal cards can handle long combo names without ugly overflow.
- [x] Cook and leftover meals are visually distinct.
- [x] Leftovers remain linked correctly to original cook batch.
- [x] Existing planner functionality remains intact.

---

# Page 3 â€” Grocery List UX Polish

## Current State

The grocery page is more usable than the planner, but it still feels like an admin checklist.

## Required Improvements

Make it feel more like a friendly shopping list.

## Grocery Header

Use a warmer summary card:

```text
This Weekâ€™s Groceries
Jun 29 â€“ Jul 5

16 main items
8 pantry staples
1 checked off
```

Use small soft stat cards or badges.

## Grocery Checklist Rows

Current rows are too wide and the Delete button is too visually prominent.

Improve grocery item rows:

- Bigger checkbox/tap target
- Ingredient name prominent
- Source badge smaller and softer
- Delete action hidden behind:
  - small icon button, or
  - overflow menu, or
  - only visible on hover/active

For mobile, keep delete accessible but not visually dominant.

## Checked Item Behavior

When item is checked:

- Apply strikethrough
- Lower opacity slightly
- Move to bottom only if simple to implement; otherwise keep in place

## Manual Add Item

Make manual add easier:

- Input and Add button should stack nicely on mobile.
- Pressing Enter should add item.
- Clear input after adding.

## Pantry Staples Section

Make pantry staples section visually separate and gentle.

Example:

```text
Pantry staples used this week
Soy sauce Â· Oyster sauce Â· Oil Â· Pepper
```

Use compact beige chips.

## Grocery Page Acceptance Criteria

- [ ] Grocery list feels like a shopping checklist, not admin rows.
- [ ] Delete buttons are less visually dominant.
- [ ] Checked state is clear.
- [ ] Manual add item works smoothly.
- [ ] Pantry staples are shown as soft chips.
- [ ] Page is very usable on phone.

---

# Page 4 â€” Dashboard/Home Polish

## Goal

Make the home page feel like a cozy app landing dashboard.

Dashboard should show:

```text
Good evening / Welcome back
Todayâ€™s meals
Tomorrowâ€™s leftovers
Quick actions
This week summary
```

Quick actions:

```text
Plan dinner
Add dish
View groceries
Create combo
```

Use friendly cards.

Empty states should be warm and helpful.

Example empty state:

```text
No meals planned yet ðŸ³
Start by adding a dish or planning dinner for this week.
```

---

# Page 5 â€” Meal Combos UX Polish

## Goal

Make combos feel like reusable â€œmeal setsâ€.

Rename visually if appropriate:

```text
Meal Combos
```

or

```text
Meal Sets
```

Do not change database names unless necessary.

Combo cards should show:

- Combo name
- Dish chips
- Number of dishes
- Edit button
- Use in planner button if simple

Example:

```text
Pork + Rice + Broccoli

[Stir fry pork] [Rice] [Boiled broccoli]

3 dishes
```

---

# Component-Level Requirements

## Buttons

Create consistent button variants:

```text
Primary: blush/sage filled
Secondary: cream/white outline
Ghost: no background
Danger: soft red outline/fill
```

Buttons should feel soft and rounded.

## Cards

All major surfaces should use consistent card components.

Card style:

```text
rounded-2xl
soft beige border
warm white background
subtle shadow
```

## Badges / Pills

Use badges for:

```text
Cook
Leftover
Grocery
Pantry
Optional
Generated
Manual
Portions
```

Badges should be small, rounded, and soft-coloured.

## Forms

Forms should be:

- Less vertically wasteful
- Better grouped
- More compact on desktop
- Comfortable on mobile
- Use clear helper text only where needed

Avoid repeating helper text under every ingredient row.

## Empty States

Create friendly empty states with small icons/illustrations.

Examples:

```text
No dishes yet
Add your first dish to start building meal combos.
```

```text
Nothing planned for dinner
Add a meal or use leftovers.
```

```text
Your grocery list is empty
Generate groceries from this weekâ€™s cooked meals.
```

---

# Responsiveness Requirements

Test these viewport widths:

```text
375px mobile
430px large mobile
768px tablet
1024px laptop
1440px desktop
```

Must avoid:

- Horizontal page scrolling
- Cramped planner columns
- Cut-off meal cards
- Buttons overflowing
- Forms requiring excessive scrolling unnecessarily

---

# Technical Constraints

## Preserve Existing Logic

Do not break:

- Dish creation/edit/delete
- Ingredient types
- Meal combo creation
- Weekly planner
- Cook batch creation
- Leftover assignment
- Grocery list generation
- Pantry exclusion
- Authentication
- Supabase integration

## Do Not Overbuild

Do not add:

- Calories/macros
- AI meal generation
- Recipe importing
- Native mobile app logic
- Complex animations
- Payment features
- Multi-user invite flow

## Use Existing Libraries Where Possible

Check the current project before adding new dependencies.

If already using Tailwind, use Tailwind.

If already using shadcn/ui, improve shadcn components.

If no icon library exists, add Lucide React.

Do not introduce a heavy UI framework unless necessary.

---

# Suggested Implementation Order

## Phase 1 â€” Design System

- [ ] Add/adjust CSS variables or Tailwind theme colours.
- [ ] Create consistent card, button, badge, input styles.
- [ ] Add logo.
- [ ] Add subtle background pattern.
- [ ] Update global layout/background.
- [ ] Improve header/navigation active states.

## Phase 2 â€” Dishes UX

- [ ] Replace large ingredient rows with bulk ingredient textarea.
- [ ] Add ingredient chip system.
- [ ] Add Grocery/Pantry/Optional quick type controls.
- [ ] Add common pantry quick-add buttons.
- [ ] Improve dish list cards.
- [ ] Improve mobile layout.

## Phase 3 â€” Planner UX

- [ ] Replace narrow 7-column layout.
- [ ] Show Lunch + Dinner by default.
- [ ] Add optional breakfast toggle.
- [ ] Create day tabs or responsive day cards.
- [ ] Redesign meal cards.
- [ ] Improve add meal modal.
- [ ] Preserve leftover logic.

## Phase 4 â€” Grocery UX

- [ ] Improve grocery summary card.
- [ ] Redesign checklist rows.
- [ ] Make checkboxes easier to tap.
- [ ] De-emphasize delete buttons.
- [ ] Improve manual add item flow.
- [ ] Show pantry staples as soft chips.

## Phase 5 â€” Final Polish

- [ ] Polish dashboard.
- [ ] Polish combo cards.
- [ ] Add empty states.
- [ ] Check all responsive breakpoints.
- [ ] Remove visual inconsistencies.
- [ ] Run full regression test.

---

# Testing Checklist

## Visual Testing

- [ ] App no longer looks like a plain admin dashboard.
- [ ] Colour palette is soft, warm, and consistent.
- [ ] Logo appears in header.
- [ ] Background pattern is subtle and not distracting.
- [ ] Cards/buttons/badges are visually consistent.
- [ ] Text is readable on all backgrounds.
- [ ] UI looks good on laptop.
- [ ] UI looks good on phone width.

## Dishes Testing

- [ ] User can create dish.
- [ ] User can paste multiple ingredients line by line.
- [ ] User can convert pasted lines into ingredients.
- [ ] User can mark ingredients as Grocery/Pantry/Optional.
- [x] User can quick-add pantry staples.
- [ ] User can edit/delete ingredients.
- [ ] User can save dish successfully.
- [ ] Existing dishes still load correctly.

## Planner Testing

- [ ] Planner no longer uses cramped narrow columns.
- [ ] Lunch and Dinner show by default.
- [ ] Breakfast can be shown optionally.
- [ ] User can add cooked meal.
- [ ] User can assign leftovers.
- [ ] Leftover meal displays clearly.
- [ ] Cook meal displays clearly.
- [ ] Long meal combo names wrap cleanly.
- [ ] No horizontal scrolling on mobile.
- [ ] Existing planner data still displays correctly.

## Grocery Testing

- [ ] Grocery list generates correctly.
- [ ] Leftovers do not duplicate ingredients.
- [ ] Pantry staples remain excluded from main grocery list.
- [ ] Pantry staples show as reference chips.
- [ ] User can check/uncheck items.
- [ ] User can add manual grocery item.
- [ ] User can delete grocery item.
- [ ] Checked items are visually clear.

## Regression Testing

- [ ] Auth still works.
- [ ] Navigation still works.
- [ ] Supabase reads/writes still work.
- [ ] No TypeScript errors.
- [ ] No console errors.
- [ ] No broken routes.
- [ ] No layout overflow.
- [ ] App deploys successfully.

---

# Final Acceptance Criteria

This UI/UX enhancement is complete when:

```text
1. The app visually feels like a cozy pastel household meal planning app.
2. The dishes page allows fast ingredient entry without excessive scrolling.
3. The planner no longer uses ugly narrow 7-day meal columns.
4. Lunch and Dinner are the default visible meal slots.
5. Cooked meals and leftovers are visually easy to distinguish.
6. Grocery list feels like a shopping checklist.
7. The app works well on laptop and mobile.
8. Existing meal planning, leftover, pantry, and grocery generation logic still works.
```

---

# Recommended First Agent Command

Use this command with the dev AI agent:

```text
Implement Phase 1 and Phase 3 first. The highest priority is redesigning the visual system and fixing the weekly planner layout. Do not touch database schema. Do not change grocery generation logic. Preserve all existing Supabase logic.
```


