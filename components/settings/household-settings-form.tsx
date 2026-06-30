'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { ToastMessage } from '@/components/ui/toast-message';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type HouseholdSettingsFormProps = {
  householdId: string;
  initialName: string;
  initialPeoplePerMeal: number;
  initialLeftoverEnabled: boolean;
};

export function HouseholdSettingsForm({
  householdId,
  initialName,
  initialPeoplePerMeal,
  initialLeftoverEnabled
}: HouseholdSettingsFormProps) {
  const [name, setName] = useState(initialName);
  const [peoplePerMeal, setPeoplePerMeal] = useState(String(initialPeoplePerMeal));
  const [leftoverEnabled, setLeftoverEnabled] = useState(initialLeftoverEnabled);
  const [savedSnapshot, setSavedSnapshot] = useState({
    name: initialName,
    peoplePerMeal: initialPeoplePerMeal,
    leftoverEnabled: initialLeftoverEnabled
  });
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = useMemo(() => {
    return (
      name.trim() !== savedSnapshot.name ||
      Number(peoplePerMeal) !== savedSnapshot.peoplePerMeal ||
      leftoverEnabled !== savedSnapshot.leftoverEnabled
    );
  }, [leftoverEnabled, name, peoplePerMeal, savedSnapshot]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const parsedPeople = Number(peoplePerMeal);

    if (!trimmedName) {
      setError('Household name is required.');
      return;
    }

    if (!Number.isInteger(parsedPeople) || parsedPeople < 1) {
      setError('Default people per meal must be at least 1.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);

    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase
      .from('households')
      .update({
        name: trimmedName,
        default_people_per_meal: parsedPeople,
        default_leftover_enabled: leftoverEnabled
      })
      .eq('id', householdId);

    setIsSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSavedSnapshot({
      name: trimmedName,
      peoplePerMeal: parsedPeople,
      leftoverEnabled
    });
    setMessage('Household settings saved.');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-foreground">Household name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-foreground">Default people per meal</span>
        <input
          value={peoplePerMeal}
          onChange={(event) => setPeoplePerMeal(event.target.value)}
          type="number"
          min={1}
          step={1}
          className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
        />
      </label>

      <label className="flex items-start gap-3 rounded-2xl border border-border bg-white px-4 py-3 text-sm">
        <input
          checked={leftoverEnabled}
          onChange={(event) => setLeftoverEnabled(event.target.checked)}
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-border"
        />
        <span>
          <span className="block font-medium text-foreground">Default leftover setting</span>
          <span className="mt-1 block leading-6 text-muted-foreground">
            Turn this on if most meal plans should include leftovers by default.
          </span>
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSaving || !hasChanges}
          className="rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? 'Saving...' : 'Save settings'}
        </button>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>

      {message ? <ToastMessage message={message} onDismiss={() => setMessage(null)} /> : null}
    </form>
  );
}
