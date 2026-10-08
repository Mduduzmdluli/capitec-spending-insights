import { describe, expect, it } from 'vitest';
import { transactionSchema } from '../../api/schemas';
import { generateTransactions } from './generate';

const endDate = new Date(2026, 5, 30); // 30 June 2026

describe('generateTransactions', () => {
  it('is deterministic for the same seed', () => {
    expect(generateTransactions({ seed: 1, endDate })).toEqual(
      generateTransactions({ seed: 1, endDate }),
    );
  });

  it('produces different data for different seeds', () => {
    expect(generateTransactions({ seed: 1, endDate })).not.toEqual(
      generateTransactions({ seed: 2, endDate }),
    );
  });

  it('only produces transactions that match the API contract', () => {
    const transactions = generateTransactions({ endDate });
    expect(transactions.length).toBeGreaterThan(500);
    for (const t of transactions) {
      expect(transactionSchema.safeParse(t).success).toBe(true);
    }
  });

  it('includes one salary payment per month', () => {
    const salaries = generateTransactions({ endDate }).filter((t) => t.type === 'credit');
    expect(salaries).toHaveLength(12);
  });
});
