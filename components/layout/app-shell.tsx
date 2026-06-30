'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { LogoutButton } from '@/components/auth/logout-button';
import { mainNavItems } from '@/lib/navigation';
import { getSupabaseStatus } from '@/lib/supabase/client';

const mobileNavItems = mainNavItems.filter((item) => item.href !== '/combos');

type AppShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

function MealPlannerLogo() {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,175,192,0.22))] shadow-[0_10px_22px_rgba(90,60,70,0.08)]">
      <svg viewBox="0 0 48 48" className="h-7 w-7 text-primary" fill="none" aria-hidden="true">
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

function NavPill({
  href,
  label,
  shortLabel,
  active,
  compact = false
}: {
  href: string;
  label: string;
  shortLabel: string;
  active: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition ${
        compact ? 'px-3 py-2 text-xs' : ''
      } ${
        active
          ? 'border-primary/35 bg-primary/18 text-foreground shadow-[0_10px_22px_rgba(244,175,192,0.2)]'
          : 'border-border/80 bg-white/85 text-muted-foreground hover:-translate-y-0.5 hover:border-primary/25 hover:bg-white hover:text-foreground hover:shadow-[0_12px_24px_rgba(90,60,70,0.08)]'
      }`}
    >
      {compact ? shortLabel : label}
    </Link>
  );
}

export function AppShell({ title, description, children }: AppShellProps) {
  const pathname = usePathname();
  const supabaseStatus = getSupabaseStatus();

  return (
    <div className="min-h-screen bg-shell text-foreground">
      <header className="sticky top-0 z-20 border-b border-[#eadde2] bg-[rgba(255,249,250,0.9)] backdrop-blur-md">
        <div className="mx-auto max-w-[1200px] px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <MealPlannerLogo />
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Household Meal Planner
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
                  {title}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-[0.95rem]">
                  {description}
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-3 lg:flex">
              <nav className="flex flex-wrap items-center gap-2">
                {mainNavItems.map((item) => (
                  <NavPill
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    shortLabel={item.shortLabel}
                    active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                  />
                ))}
              </nav>
              <div className="ml-1 border-l border-[#eadde2] pl-3">
                <LogoutButton className="border-[#eadde2] bg-white/90 px-4 py-2 text-sm text-muted-foreground shadow-none hover:border-primary/25 hover:text-foreground" />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 lg:hidden">
            <nav className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {mainNavItems.map((item) => (
                <NavPill
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  shortLabel={item.shortLabel}
                  active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                  compact
                />
              ))}
            </nav>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs leading-5 text-muted-foreground">
                Keep the whole household moving from one cozy workspace.
              </p>
              <LogoutButton className="border-[#eadde2] bg-white/85 px-3 py-2 text-xs text-muted-foreground shadow-none hover:border-primary/25 hover:text-foreground" />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] px-4 py-5 pb-28 sm:px-6 lg:px-8 lg:py-8">
        <section className="rounded-[2rem] border border-[#eadde2] bg-white/90 p-5 shadow-[0_10px_30px_rgba(90,60,70,0.06)] backdrop-blur-sm sm:p-6 lg:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
            {!supabaseStatus.ready ? (
              <div className="rounded-[1.25rem] border border-[rgba(244,175,192,0.35)] bg-[rgba(255,247,250,0.95)] px-4 py-3 text-sm text-foreground shadow-[0_8px_20px_rgba(90,60,70,0.05)]">
                <p className="font-semibold">Developer setup needed</p>
                <p className="mt-1 text-muted-foreground">
                  Missing: {supabaseStatus.missing.join(', ')}. Copy `.env.local.example` to
                  `.env.local`.
                </p>
              </div>
            ) : null}
          </div>
          <div className="mt-6">{children}</div>
        </section>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#eadde2] bg-[rgba(255,249,250,0.96)] px-2 py-2 backdrop-blur-md lg:hidden">
        <div className="mx-auto grid max-w-[1200px] grid-cols-5 gap-2">
          {mobileNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href || pathname.startsWith(`${item.href}/`) ? 'page' : undefined}
              className={`rounded-[1.15rem] border px-2 py-3 text-center text-[0.72rem] font-semibold leading-none transition ${
                pathname === item.href || pathname.startsWith(`${item.href}/`)
                  ? 'border-primary/35 bg-primary/18 text-foreground shadow-[0_8px_18px_rgba(244,175,192,0.16)]'
                  : 'border-[#eadde2] bg-white/92 text-muted-foreground'
              }`}
            >
              {item.shortLabel}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
