const MS_PER_DAY = 86_400_000;

/** Local calendar date as YYYY-MM-DD (not UTC). */
export function localDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Whole calendar days from one YYYY-MM-DD to another, timezone-independent. */
export function calendarDaysBetween(from: string, to: string): number {
  const [fromYear, fromMonth, fromDay] = from.split('-').map(Number);
  const [toYear, toMonth, toDay] = to.split('-').map(Number);
  const start = Date.UTC(fromYear, fromMonth - 1, fromDay);
  const end = Date.UTC(toYear, toMonth - 1, toDay);
  return Math.round((end - start) / MS_PER_DAY);
}

export function nextStreakDays(
  lastAccessDate: string | undefined,
  today: string,
  currentStreak: number
): number {
  if (lastAccessDate === today) return currentStreak;
  const daysSinceLastAccess = lastAccessDate
    ? calendarDaysBetween(lastAccessDate, today)
    : 0;
  return daysSinceLastAccess === 1 ? currentStreak + 1 : 1;
}
