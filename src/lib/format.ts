import { isToday, isYesterday, format } from "date-fns";
import { es } from "date-fns/locale";

export function formatDayLabel(date: Date): string {
  if (isToday(date)) return "Hoy";
  if (isYesterday(date)) return "Ayer";
  return format(date, "d 'de' MMMM", { locale: es });
}

export function formatCurrency(amount: number | string): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export function formatDateTime(date: Date): string {
  return format(date, "d MMM yyyy, HH:mm", { locale: es });
}

/** Groups a list of items by day label ("Hoy", "Ayer", "12 de agosto"), preserving order. */
export function groupByDay<T>(items: T[], getDate: (item: T) => Date): { label: string; items: T[] }[] {
  const groups: { label: string; items: T[] }[] = [];
  for (const item of items) {
    const label = formatDayLabel(getDate(item));
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.items.push(item);
    } else {
      groups.push({ label, items: [item] });
    }
  }
  return groups;
}
