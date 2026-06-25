'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { PageSection } from '@/components/layout/page-section';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type DebugState = {
  sessionEmail: string | null;
  householdId: string | null;
  anonDishCount: number | null;
  authDishCount: number | null;
  error: string | null;
  loading: boolean;
};

type ProfileRow = {
  household_id: string;
};

export default function RlsDebugPage() {
  const [state, setState] = useState<DebugState>({
    sessionEmail: null,
    householdId: null,
    anonDishCount: null,
    authDishCount: null,
    error: null,
    loading: true
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    async function load() {
      const { count: anonCount, error: anonError } = await supabase
        .from('dishes')
        .select('*', { count: 'exact', head: true });

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        setState({
          sessionEmail: null,
          householdId: null,
          anonDishCount: anonCount ?? null,
          authDishCount: null,
          error: sessionError.message,
          loading: false
        });
        return;
      }

      const user = sessionData.session?.user ?? null;

      if (!user) {
        setState({
          sessionEmail: null,
          householdId: null,
          anonDishCount: anonCount ?? null,
          authDishCount: null,
          error: anonError?.message ?? 'No authenticated session found.',
          loading: false
        });
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('household_id')
        .eq('id', user.id)
        .single();

      const profile = profileData as ProfileRow | null;

      if (profileError || !profile) {
        setState({
          sessionEmail: user.email ?? null,
          householdId: null,
          anonDishCount: anonCount ?? null,
          authDishCount: null,
          error: profileError?.message ?? 'No profile row found.',
          loading: false
        });
        return;
      }

      const { count: authCount, error: authError } = await supabase
        .from('dishes')
        .select('*', { count: 'exact', head: true });

      setState({
        sessionEmail: user.email ?? null,
        householdId: profile.household_id,
        anonDishCount: anonCount ?? null,
        authDishCount: authCount ?? null,
        error: anonError?.message ?? authError?.message ?? null,
        loading: false
      });
    }

    void load();
  }, []);

  async function signIn() {
    setActionError(null);
    setActionMessage(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setActionError(error.message);
      return;
    }
    setActionMessage('Signed in successfully. Refreshing session info...');
    window.location.reload();
  }

  async function signOut() {
    setActionError(null);
    setActionMessage(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      setActionError(error.message);
      return;
    }
    setActionMessage('Signed out successfully.');
    window.location.reload();
  }

  return (
    <AppShell
      title="RLS Debug"
      description="Check anonymous and authenticated access from the browser."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <PageSection eyebrow="Session" title="Current auth state">
          <div className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>Loading: {state.loading ? 'yes' : 'no'}</p>
            <p>Email: {state.sessionEmail ?? 'not signed in'}</p>
            <p>Household ID: {state.householdId ?? 'none'}</p>
            <p>Anonymous dish count: {state.anonDishCount ?? 'unknown'}</p>
            <p>Authenticated dish count: {state.authDishCount ?? 'unknown'}</p>
            {state.error ? <p className="text-danger">Error: {state.error}</p> : null}
          </div>
        </PageSection>

        <PageSection eyebrow="Auth" title="Sign in / out">
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-foreground">Email</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none"
                placeholder="you@example.com"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-foreground">Password</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none"
                placeholder="••••••••"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={signIn}
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={signOut}
                className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground"
              >
                Sign out
              </button>
            </div>
            {actionMessage ? <p className="text-sm text-primary">{actionMessage}</p> : null}
            {actionError ? <p className="text-sm text-danger">{actionError}</p> : null}
          </div>
        </PageSection>
      </div>
    </AppShell>
  );
}
