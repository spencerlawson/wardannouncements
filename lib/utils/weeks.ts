import { startOfWeek, endOfWeek, addWeeks, format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export interface WeekBounds {
  weekStart: Date;
  weekEnd: Date;
  weekStartStr: string; // "yyyy-MM-dd" for DB date comparisons
  weekEndStr: string;
}

export function getWeekBounds(timezone: string, weekOffset = 0): WeekBounds {
  const now = new Date();
  const zonedNow = toZonedTime(now, timezone);
  const targetDate = addWeeks(zonedNow, weekOffset);

  // Week runs Sunday (0) → Saturday (6)
  const weekStart = startOfWeek(targetDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(targetDate, { weekStartsOn: 0 });

  return {
    weekStart,
    weekEnd,
    weekStartStr: format(weekStart, "yyyy-MM-dd"),
    weekEndStr: format(weekEnd, "yyyy-MM-dd"),
  };
}

export function weekOffsetLabel(offset: number): string {
  if (offset === 0) return "This Week";
  if (offset === -1) return "Last Week";
  if (offset < 0) return `${Math.abs(offset)} Weeks Ago`;
  if (offset === 1) return "Next Week";
  return `${offset} Weeks from Now`;
}
