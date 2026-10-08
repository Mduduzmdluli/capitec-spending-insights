import {
  addDays,
  eachMonthOfInterval,
  isWeekend,
  isWithinInterval,
  setDate,
  startOfDay,
  subDays,
} from 'date-fns';
import type { Transaction } from '../../api/schemas';
import { DISCRETIONARY_PROFILES, RECURRING_PAYMENTS, SALARY } from './merchants';
import { createRng, pick } from './random';

type GenerateOptions = {
  /** The same seed and end date always produce the same data. */
  seed?: number;
  endDate?: Date;
  days?: number;
};

type TransactionDraft = Omit<Transaction, 'id'>;

function timestamp(day: Date, hour: number, minute: number): string {
  const date = new Date(day);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export function generateTransactions({
  seed = 42,
  endDate = new Date(),
  days = 365,
}: GenerateOptions = {}): Transaction[] {
  const rng = createRng(seed);
  const end = startOfDay(endDate);
  const start = subDays(end, days - 1);
  const inRange = (date: Date) => isWithinInterval(date, { start, end });
  const drafts: TransactionDraft[] = [];

  // Day-to-day card spending
  for (let day = start; day.getTime() <= end.getTime(); day = addDays(day, 1)) {
    const weekendDay = isWeekend(day);

    for (const profile of DISCRETIONARY_PROFILES) {
      const chance = (profile.perWeek / 7) * (weekendDay ? profile.weekendMultiplier : 1);
      if (rng() >= chance) continue;

      const date = timestamp(day, 7 + Math.floor(rng() * 15), Math.floor(rng() * 60));
      const merchant = pick(rng, profile.merchants);
      // Skew towards smaller amounts: most purchases are small, a few are large
      const rand = profile.minRand + rng() ** 1.6 * (profile.maxRand - profile.minRand);

      // Never generate transactions later than "now"
      if (Date.parse(date) > endDate.getTime()) continue;

      drafts.push({
        date,
        merchant,
        category: profile.category,
        amountCents: Math.round(rand * 100),
        type: 'debit',
        channel: 'card',
      });
    }
  }

  // Monthly debit orders and salary
  for (const month of eachMonthOfInterval({ start, end })) {
    for (const payment of RECURRING_PAYMENTS) {
      const day = setDate(month, payment.dayOfMonth);
      if (!inRange(day)) continue;
      drafts.push({
        date: timestamp(day, 6, 0),
        merchant: payment.merchant,
        category: payment.category,
        amountCents: payment.amountCents,
        type: 'debit',
        channel: 'debit_order',
      });
    }

    const payday = setDate(month, SALARY.dayOfMonth);
    if (inRange(payday)) {
      drafts.push({
        date: timestamp(payday, 5, 0),
        merchant: SALARY.merchant,
        category: 'income',
        amountCents: SALARY.amountCents,
        type: 'credit',
        channel: 'eft',
      });
    }
  }

  // Newest first, with stable IDs
  drafts.sort((a, b) => b.date.localeCompare(a.date));
  return drafts.map((draft, index) => ({
    id: `txn_${String(drafts.length - index).padStart(6, '0')}`,
    ...draft,
  }));
}
