import type { Transaction } from '../api/schemas';
import { MOCK_USERS } from './data/customers';
import type { MockUser } from './data/customers';
import { generateTransactions } from './data/generate';

export function findUser(customerId: string): MockUser | undefined {
  return MOCK_USERS.find((user) => user.id === customerId);
}

/** Usernames are matched case-insensitively, ignoring surrounding spaces. */
export function findUserByUsername(username: string): MockUser | undefined {
  const normalised = username.trim().toLowerCase();
  return MOCK_USERS.find((user) => user.username.toLowerCase() === normalised);
}

const transactionsByCustomer = new Map<string, Transaction[]>();

/** Each customer's two years of transactions, generated on first use and then reused. */
export function getTransactions(customerId: string): Transaction[] {
  const cached = transactionsByCustomer.get(customerId);
  if (cached) return cached;

  const user = findUser(customerId);
  const transactions = user
    ? generateTransactions({ seed: user.seed, days: 730, spending: user.spending })
    : [];

  transactionsByCustomer.set(customerId, transactions);
  return transactions;
}
