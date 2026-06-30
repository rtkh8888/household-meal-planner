'use client';

import { useEffect } from 'react';

type ToastMessageProps = {
  message: string;
  onDismiss: () => void;
  tone?: 'success' | 'error';
};

export function ToastMessage({
  message,
  onDismiss,
  tone = 'success'
}: ToastMessageProps) {
  useEffect(() => {
    const timeout = window.setTimeout(onDismiss, 2800);
    return () => window.clearTimeout(timeout);
  }, [message, onDismiss]);

  const toneClasses =
    tone === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-900'
      : 'border-emerald-200 bg-emerald-50 text-emerald-950';

  return (
    <div
      className={`fixed inset-x-4 bottom-24 z-40 mx-auto max-w-sm rounded-2xl border px-4 py-3 text-sm font-semibold shadow-soft md:inset-x-auto md:right-6 md:bottom-6 ${toneClasses}`}
    >
      {message}
    </div>
  );
}
