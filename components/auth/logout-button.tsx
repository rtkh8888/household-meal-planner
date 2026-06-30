'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className = '' }: LogoutButtonProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setIsSigningOut(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: signOutError } = await supabase.auth.signOut();

    setIsSigningOut(false);

    if (signOutError) {
      setError(signOutError.message);
      return;
    }

    router.replace('/login');
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleLogout}
        disabled={isSigningOut}
        className={`rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition hover:-translate-y-0.5 hover:border-lavender/40 hover:bg-white hover:shadow-[0_10px_20px_rgba(90,60,70,0.08)] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        {isSigningOut ? 'Signing out...' : 'Log out'}
      </button>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
