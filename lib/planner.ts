const DAY_MS = 24 * 60 * 60 * 1000;

export type PlannerMealType = 'breakfast' | 'lunch' | 'dinner';

export type PlannerDay = {
  isoDate: string;
  dayLabel: string;
  dateLabel: string;
  isToday: boolean;
};

function normalizeDateInput(value: Date | string) {
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
  }

  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
}

function formatIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getWeekStart(value: Date | string) {
  const date = normalizeDateInput(value);
  const day = date.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;

  date.setUTCDate(date.getUTCDate() + offset);
  return formatIsoDate(date);
}

export function getWeekDays(weekStartDate: string): PlannerDay[] {
  const start = normalizeDateInput(weekStartDate);
  const today = formatIsoDate(normalizeDateInput(new Date()));

  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(start.getTime() + index * DAY_MS);

    return {
      isoDate: formatIsoDate(current),
      dayLabel: current.toLocaleDateString('en-US', {
        weekday: 'short',
        timeZone: 'UTC'
      }),
      dateLabel: current.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
      }),
      isToday: formatIsoDate(current) === today
    };
  });
}

export function getNextMealSlot(date: string, mealType: PlannerMealType) {
  if (mealType === 'breakfast') {
    return { date, mealType: 'lunch' as const };
  }

  if (mealType === 'lunch') {
    return { date, mealType: 'dinner' as const };
  }

  const current = normalizeDateInput(date);
  current.setUTCDate(current.getUTCDate() + 1);

  return {
    date: formatIsoDate(current),
    mealType: 'lunch' as const
  };
}

export function calculateLeftoverPortions(portionsCooked: number, portionsEaten: number) {
  return Math.max(0, portionsCooked - portionsEaten);
}

export function formatWeekRange(weekStartDate: string) {
  const days = getWeekDays(weekStartDate);
  const first = normalizeDateInput(days[0].isoDate);
  const last = normalizeDateInput(days[6].isoDate);

  const firstLabel = first.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });

  const lastLabel = last.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });

  return `${firstLabel} - ${lastLabel}`;
}
