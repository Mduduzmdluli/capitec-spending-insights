import { format, isSameDay, parseISO, subDays } from 'date-fns';
import type { Transaction } from '../../../api/schemas';

export type DayGroup = {
  key: string;
  label: string;
  items: Transaction[];
};

/** "Today", "Yesterday", or e.g. "Wednesday 7 October" (with the year if it isn't this year). */
export function formatDayHeading(date: Date, today: Date = new Date()): string {
  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, subDays(today, 1))) return 'Yesterday';
  const sameYear = date.getFullYear() === today.getFullYear();
  return format(date, sameYear ? 'EEEE d MMMM' : 'EEEE d MMMM yyyy');
}

/** Groups consecutive transactions that fall on the same local calendar day. */
export function groupByDay(transactions: Transaction[], today: Date = new Date()): DayGroup[] {
  const groups: DayGroup[] = [];

  for (const transaction of transactions) {
    const date = parseISO(transaction.date);
    const key = format(date, 'yyyy-MM-dd');
    const current = groups[groups.length - 1];

    if (current && current.key === key) {
      current.items.push(transaction);
    } else {
      groups.push({ key, label: formatDayHeading(date, today), items: [transaction] });
    }
  }

  return groups;
}
