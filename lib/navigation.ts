export type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
};

export const mainNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', shortLabel: 'Home' },
  { href: '/dishes', label: 'Dishes', shortLabel: 'Dishes' },
  { href: '/combos', label: 'Meal Combos', shortLabel: 'Combos' },
  { href: '/planner', label: 'Planner', shortLabel: 'Plan' },
  { href: '/grocery', label: 'Grocery List', shortLabel: 'Groceries' },
  { href: '/settings', label: 'Settings', shortLabel: 'Settings' }
];

