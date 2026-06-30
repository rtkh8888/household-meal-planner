const DAY_MS = 24 * 60 * 60 * 1000;

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

export function getWeekDays(weekStartDate: string) {
  const start = normalizeDateInput(weekStartDate);
  return Array.from({ length: 7 }, (_, index) => new Date(start.getTime() + index * DAY_MS));
}

export function formatWeekRange(weekStartDate: string) {
  const days = getWeekDays(weekStartDate);
  const first = days[0];
  const last = days[6];

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

export function shiftIsoDate(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
