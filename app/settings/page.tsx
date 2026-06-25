import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { PageSection } from '@/components/layout/page-section';

export default function SettingsPage() {
  return (
    <AppShell
      title="Settings"
      description="Keep the app ready for future auth, household preferences, and deployment settings."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <PageSection eyebrow="Environment" title="Supabase configuration">
          <p className="text-sm leading-6 text-muted-foreground">
            Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{' '}
            in <code>.env.local</code> for local development.
          </p>
        </PageSection>

        <PageSection eyebrow="Platform" title="PWA and hosting">
          <p className="text-sm leading-6 text-muted-foreground">
            The manifest and app icons are in place so the app can be installed like a basic PWA
            and deployed to Vercel.
          </p>
        </PageSection>

        <PageSection eyebrow="Diagnostics" title="RLS test helper">
          <p className="text-sm leading-6 text-muted-foreground">
            Use the diagnostic page to confirm the current session and household-scoped access.
          </p>
          <Link
            href="/settings/rls-debug"
            className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Open RLS debug
          </Link>
        </PageSection>
      </div>
    </AppShell>
  );
}
