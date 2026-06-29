'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseEnv } from '@/lib/env';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type LoginFormProps = {
  nextPath: string;
};

function getAuthRedirectUrl(nextPath: string) {
  const { appUrl } = getSupabaseEnv();
  const baseUrl = appUrl || window.location.origin;
  return `${baseUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`;
}

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<'password' | 'magic' | 'signup' | null>(null);

  const canSubmit = useMemo(() => email.trim().length > 0, [email]);

  async function signInWithPassword() {
    if (!canSubmit || !password.trim()) {
      setError('Enter your email and password first.');
      return;
    }

    setError(null);
    setMessage(null);
    setPendingAction('password');

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    setPendingAction(null);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  async function sendMagicLink() {
    if (!canSubmit) {
      setError('Enter your email first.');
      return;
    }

    setError(null);
    setMessage(null);
    setPendingAction('magic');

    const supabase = createSupabaseBrowserClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: getAuthRedirectUrl(nextPath)
      }
    });

    setPendingAction(null);

    if (otpError) {
      setError(otpError.message);
      return;
    }

    setMessage('Check your inbox for the magic link.');
  }

  async function createAccount() {
    if (!canSubmit || !password.trim()) {
      setError('Enter your email and password first.');
      return;
    }

    setError(null);
    setMessage(null);
    setPendingAction('signup');

    const supabase = createSupabaseBrowserClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: getAuthRedirectUrl(nextPath)
      }
    });

    setPendingAction(null);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setMessage('Account created. If confirmation is enabled, check your inbox to finish signing in.');
  }

  const isBusy = pendingAction !== null;

  return (
    <div className="space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-foreground">Email</span>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          autoComplete="email"
          className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
          placeholder="you@example.com"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-foreground">Password</span>
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          autoComplete="current-password"
          className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
          placeholder="Create or enter a password"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={signInWithPassword}
          disabled={isBusy}
          className="rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pendingAction === 'password' ? 'Signing in...' : 'Sign in with password'}
        </button>
        <button
          type="button"
          onClick={sendMagicLink}
          disabled={isBusy}
          className="rounded-full border border-border bg-white px-4 py-3 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:shadow-soft disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pendingAction === 'magic' ? 'Sending link...' : 'Send magic link'}
        </button>
      </div>

      <button
        type="button"
        onClick={createAccount}
        disabled={isBusy}
        className="w-full rounded-full border border-dashed border-border bg-muted/40 px-4 py-3 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pendingAction === 'signup' ? 'Creating account...' : 'Create password account'}
      </button>

      {message ? <p className="text-sm text-primary">{message}</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
