'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { LogoutButton } from '@/components/auth/logout-button';
import { mainNavItems } from '@/lib/navigation';
import { getSupabaseStatus } from '@/lib/supabase/client';

type AppShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AppShell({ title, description, children }: AppShellProps) {
  const supabaseStatus = getSupabaseStatus();

  return (
    <div className="min-h-screen bg-shell">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-[rgba(247,244,239,0.82)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Household Meal Planner
            </p>
            <h1 className="mt-1 text-xl font-semibold text-foreground">{title}</h1>
          </div>
          <div className="hidden items-center gap-2 md:flex md:flex-wrap md:justify-end">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:-translate-y-0.5 hover:shadow-soft"
              >
                {item.shortLabel}
              </Link>
            ))}
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-28 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-border bg-card/90 p-5 shadow-soft">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
            {!supabaseStatus.ready ? (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                <p className="font-semibold">Developer setup needed</p>
                <p className="mt-1">
                  Missing: {supabaseStatus.missing.join(', ')}. Copy `.env.local.example` to
                  `.env.local`.
                </p>
              </div>
            ) : null}
          </div>
          <div className="mt-6">{children}</div>
        </section>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-[rgba(247,244,239,0.94)] px-2 py-2 backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-6xl grid-cols-3 gap-2 sm:grid-cols-6">
          {mainNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-border bg-card px-3 py-3 text-center text-xs font-semibold text-foreground"
            >
              {item.shortLabel}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
