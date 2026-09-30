// Vercel functions run in UTC; the business operates on Buenos Aires wall-clock
// time. Argentina has not observed DST since 2009, so a fixed offset is safe.
const BUENOS_AIRES_OFFSET_HOURS = -3;

/** Day-of-week (0=Sun..6=Sat, JS Date#getDay convention) and minute-of-day in Buenos Aires local time. */
export function toBusinessLocalParts(date: Date): { dayOfWeek: number; minuteOfDay: number } {
  const shifted = new Date(date.getTime() + BUENOS_AIRES_OFFSET_HOURS * 60 * 60 * 1000);
  return {
    dayOfWeek: shifted.getUTCDay(),
    minuteOfDay: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  };
}

/**
 * A Monday-aligned, monotonically increasing week counter in Buenos Aires
 * local time — same instant always maps to the same integer, consecutive
 * calendar weeks differ by exactly 1. Deliberately NOT date-fns' startOfWeek/
 * isSameDay/differenceInCalendarWeeks: those read the local calendar day
 * using the *process's* local timezone (via native Date getters), which is
 * UTC on Vercel — wrong business-timezone boundary, and it would also make
 * behavior depend on the machine running the code. Plain integer math on a
 * fixed offset avoids both problems, and needs no DB Date/timestamp column
 * (store this as a plain Int).
 */
export function toBusinessWeekIndex(date: Date): number {
  const shifted = new Date(date.getTime() + BUENOS_AIRES_OFFSET_HOURS * 60 * 60 * 1000);
  const daysSinceEpoch = Math.floor(shifted.getTime() / 86_400_000);
  // Unix epoch day 0 (1970-01-01) was a Thursday (ISO weekday 4, Mon=1..Sun=7);
  // +3 realigns so the floor-division boundary falls on Monday instead.
  return Math.floor((daysSinceEpoch + 3) / 7);
}
