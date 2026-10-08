import type { Customer, Transaction } from '../api/schemas';
import { generateTransactions } from './data/generate';

export const MOCK_CUSTOMER: Customer = {
  id: 'cust_001',
  firstName: 'Thandi',
  lastName: 'Mokoena',
  accountNumberMasked: '•••• 4821',
};

let transactions: Transaction[] | null = null;

/** Generated once, on first use, then reused for every request. */
export function getTransactions(): Transaction[] {
  transactions ??= generateTransactions({ seed: 42 });
  return transactions;
}
