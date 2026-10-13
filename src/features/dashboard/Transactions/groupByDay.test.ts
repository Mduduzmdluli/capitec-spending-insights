import { describe, expect, it } from 'vitest';
import type { Transaction } from '../../../api/schemas';
import { formatDayHeading, groupByDay } from './groupByDay';

const today = new Date(2026, 9, 10, 12); // Saturday 10 October 2026, midday

const tx = (id: string, localDate: Date): Transaction => ({
  id,
  date: localDate.toISOString(),
  merchant: 'Checkers',
  category: 'groceries',
  amountCents: 10000,
  type: 'debit',
  channel: 'card',
});

describe('formatDayHeading', () => {
  it('uses friendly names for today and yesterday', () => {
    expect(formatDayHeading(new Date(2026, 9, 10, 8), today)).toBe('Today');
    expect(formatDayHeading(new Date(2026, 9, 9, 22), today)).toBe('Yesterday');
  });

  it('spells out other days, adding the year only when it differs', () => {
    expect(formatDayHeading(new Date(2026, 9, 7), today)).toBe('Wednesday 7 October');
    expect(formatDayHeading(new Date(2025, 11, 31), today)).toBe('Wednesday 31 December 2025');
  });
});

describe('groupByDay', () => {
  it('groups consecutive transactions on the same day', () => {
    const groups = groupByDay(
      [
        tx('a', new Date(2026, 9, 10, 18)),
        tx('b', new Date(2026, 9, 10, 9)),
        tx('c', new Date(2026, 9, 9, 13)),
      ],
      today,
    );

    expect(groups.map((g) => [g.label, g.items.map((t) => t.id)])).toEqual([
      ['Today', ['a', 'b']],
      ['Yesterday', ['c']],
    ]);
  });

  it('returns nothing for no transactions', () => {
    expect(groupByDay([], today)).toEqual([]);
  });
});
