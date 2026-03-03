import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from "date-fns";

export const toISODate = (value: Date) => format(value, "yyyy-MM-dd");

export function weekRange(date: string) {
  const d = new Date(date);
  return {
    from: toISODate(startOfWeek(d, { weekStartsOn: 1 })),
    to: toISODate(endOfWeek(d, { weekStartsOn: 1 }))
  };
}

export function monthRange(date: string) {
  const d = new Date(date);
  return {
    from: toISODate(startOfMonth(d)),
    to: toISODate(endOfMonth(d))
  };
}
