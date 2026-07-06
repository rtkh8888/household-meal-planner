'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { LogoutButton } from '@/components/auth/logout-button';
import { getSupabaseStatus } from '@/lib/supabase/client';
import { visibleNavItems } from '@/lib/navigation';

type AppShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

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
          ? 'border-secondary/75 bg-secondary/45 text-foreground shadow-[0_10px_22px_rgba(234,199,199,0.12)]'
          : 'border-border bg-white/90 text-muted-foreground hover:-translate-y-0.5 hover:border-primary/35 hover:bg-white hover:text-foreground hover:shadow-[0_12px_24px_rgba(31,41,51,0.07)]'
      }`}
    >
      {compact ? shortLabel : label}
    </Link>
  );
}

export function AppShell(props: AppShellProps) {
  const { title, children } = props;
  void props.description;

  const pathname = usePathname();
  const supabaseStatus = getSupabaseStatus();

  return (
    <div className="min-h-screen bg-shell text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-[rgba(255,255,255,0.88)] backdrop-blur-md">
        <div className="mx-auto max-w-[1200px] px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Household Meal Planner
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
                  {title}
                </h1>
              </div>
            </div>

            <div className="hidden items-center gap-3 lg:flex">
              <nav className="flex flex-wrap items-center gap-2">
                {visibleNavItems.map((item) => (
                  <NavPill
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    shortLabel={item.shortLabel}
                    active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                  />
                ))}
              </nav>
              <div className="ml-1 border-l border-border pl-3">
                <LogoutButton className="border-border bg-white/90 px-4 py-2 text-sm text-muted-foreground shadow-none hover:border-primary/35 hover:text-foreground" />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 lg:hidden">
            <nav className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {visibleNavItems.map((item) => (
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
              <LogoutButton className="border-border bg-white/90 px-3 py-2 text-xs text-muted-foreground shadow-none hover:border-primary/35 hover:text-foreground" />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] px-4 py-5 pb-28 sm:px-6 lg:px-8 lg:py-8">
        <section className="rounded-[2rem] border border-border bg-white/92 p-5 shadow-[0_10px_30px_rgba(90,60,70,0.06)] backdrop-blur-sm sm:p-6 lg:p-7">
          {!supabaseStatus.ready ? (
            <div className="mb-6 rounded-[1.25rem] border border-[#ece8f0] bg-white px-4 py-3 text-sm text-foreground shadow-[0_8px_20px_rgba(90,60,70,0.05)]">
              <p className="font-semibold">Developer setup needed</p>
              <p className="mt-1 text-muted-foreground">
                Missing: {supabaseStatus.missing.join(', ')}. Copy `.env.local.example` to
                `.env.local`.
              </p>
            </div>
          ) : null}
          <div>{children}</div>
        </section>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-[rgba(255,255,255,0.94)] px-2 py-2 backdrop-blur-md lg:hidden">
        <div className="mx-auto grid max-w-[1200px] grid-cols-5 gap-2">
          {visibleNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href || pathname.startsWith(`${item.href}/`) ? 'page' : undefined}
              className={`rounded-[1.15rem] border px-2 py-3 text-center text-[0.72rem] font-semibold leading-none transition ${
                pathname === item.href || pathname.startsWith(`${item.href}/`)
                  ? 'border-secondary/75 bg-secondary/45 text-foreground shadow-[0_8px_18px_rgba(234,199,199,0.12)]'
                  : 'border-border bg-white/96 text-muted-foreground'
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











