import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { PageSection } from '@/components/layout/page-section';
import { HouseholdSettingsForm } from '@/components/settings/household-settings-form';
import { getSupabaseStatus } from '@/lib/supabase/client';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function SettingsPage() {
  const supabaseStatus = getSupabaseStatus();

  if (!supabaseStatus.ready) {
    return (
      <AppShell
        title="Settings"
        description="Manage the household context used across the dashboard, planner, grocery list, and meal workflows."
      >
        <PageSection eyebrow="Environment" title="Supabase configuration missing">
          <p className="text-sm leading-6 text-muted-foreground">
            Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{' '}
            in <code>.env.local</code> to unlock auth and household settings.
          </p>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Copy <code>.env.local.example</code> to <code>.env.local</code> and fill in your project
            values, then reload the app.
          </p>
        </PageSection>
      </AppShell>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, household_id, display_name')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return (
      <AppShell
        title="Settings"
        description="Household settings could not be loaded right now."
      >
        <PageSection eyebrow="Household" title="Unable to load settings">
          <p className="text-sm leading-6 text-muted-foreground">
            Your profile could not be loaded. Try refreshing the page or signing out and back in.
          </p>
        </PageSection>
      </AppShell>
    );
  }

  const { data: household, error: householdError } = await supabase
    .from('households')
    .select('id, name, default_people_per_meal, default_leftover_enabled')
    .eq('id', profile.household_id)
    .single();

  if (householdError || !household) {
    return (
      <AppShell
        title="Settings"
        description="Household settings could not be loaded right now."
      >
        <PageSection eyebrow="Household" title="Unable to load settings">
          <p className="text-sm leading-6 text-muted-foreground">
            The authenticated household could not be loaded. Try refreshing the page or signing
            out and back in.
          </p>
        </PageSection>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Settings"
      description="Manage the household context used across the dashboard, planner, grocery list, and meal workflows."
    >
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <PageSection eyebrow="Household" title="Current workspace">
          <div className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>
              This household powers your meal library, planner, and grocery list. Every signed-in
              user belongs to exactly one household in the MVP.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-white p-4">
                <p className="text-xs uppercase tracking-[0.2em]">Household ID</p>
                <p className="mt-2 break-all font-medium text-foreground">{household.id}</p>
              </div>
              <div className="rounded-2xl border border-border bg-white p-4">
                <p className="text-xs uppercase tracking-[0.2em]">Profile ID</p>
                <p className="mt-2 break-all font-medium text-foreground">{profile.id}</p>
              </div>
            </div>
            <Link
              href="/settings/rls-debug"
              className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Open RLS debug
            </Link>
          </div>
        </PageSection>

        <PageSection eyebrow="Preferences" title="Household settings">
          <HouseholdSettingsForm
            householdId={household.id}
            initialName={household.name}
            initialPeoplePerMeal={household.default_people_per_meal}
            initialLeftoverEnabled={household.default_leftover_enabled}
          />
        </PageSection>
      </div>
    </AppShell>
  );
}
