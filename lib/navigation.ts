export type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
};

export const mainNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Home', shortLabel: 'Home' },
  { href: '/dishes', label: 'Dishes', shortLabel: 'Dishes' },
  { href: '/combos', label: 'Combos', shortLabel: 'Combos' },
  { href: '/planner', label: 'Plan', shortLabel: 'Plan' },
  { href: '/grocery', label: 'Groceries', shortLabel: 'Groceries' },
  { href: '/settings', label: 'Settings', shortLabel: 'Settings' }
];

export const visibleNavItems = mainNavItems.filter((item) => item.href !== '/combos');
