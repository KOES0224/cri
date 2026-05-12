import { format, addMinutes } from "date-fns";

/**
 * Formats a date in Korea Standard Time (UTC+9).
 * Accepts a Date object or any date-compatible value.
 */
export function formatKST(date: Date | string | number, formatStr: string): string {
  const d = new Date(date);
  // KST is UTC+9: add 9 * 60 = 540 minutes
  const kstDate = addMinutes(d, d.getTimezoneOffset() + 540);
  return format(kstDate, formatStr);
}
