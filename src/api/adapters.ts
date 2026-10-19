import { InvalidResponseError } from './client';
import { CATEGORY_API_NAMES, categoryIdFromApiName } from './contract';
import type {
  CategoriesResponse,
  GoalsResponse,
  ProfileResponse,
  SummaryResponse,
  TransactionsResponse,
  TrendsResponse,
} from './contract';
import type {
  CategoryBreakdown,
  CategoryId,
  Customer,
  SpendingSummary,
  SpendingTrends,
  Transaction,
  TransactionPage,
  TransactionQuery,
  Goal,
} from './schemas';

// ---- Money ----

/** Decimal rand from the API to exact whole cents, the moment it enters the app. */
export const toCents = (rand: number): number => Math.round(rand * 100);

/** Whole cents back to decimal rand, for the API. */
export const toRand = (cents: number): number => cents / 100;

// ---- Categories ----

/** The app's ID for an API category name; an unknown name means the contract has changed. */
function requireCategory(name: string): CategoryId {
  const id = categoryIdFromApiName(name);
  if (!id) throw new InvalidResponseError([`Unknown category "${name}"`]);
  return id;
}

// ---- Responses ----

export function toCustomer(profile: ProfileResponse): Customer {
  return {
    id: profile.customerId,
    name: profile.name,
    email: profile.email,
    joinDate: profile.joinDate,
    accountType: profile.accountType,
    totalSpentCents: toCents(profile.totalSpent),
    currency: profile.currency,
  };
}

export function toSpendingSummary(summary: SummaryResponse): SpendingSummary {
  return {
    totalSpentCents: toCents(summary.totalSpent),
    transactionCount: summary.transactionCount,
    averageTransactionCents: toCents(summary.averageTransaction),
    topCategory: summary.topCategory ? requireCategory(summary.topCategory) : null,
    spentChangePercent: summary.comparedToPrevious.spentChange,
    transactionChangePercent: summary.comparedToPrevious.transactionChange,
  };
}

export function toCategoryBreakdown(response: CategoriesResponse): CategoryBreakdown {
  return {
    // The API's colours and icons are deliberately not used: the app has its own
    // accessible palette with light and dark variants (see styles/categories.css)
    categories: response.categories.map((entry) => ({
      category: requireCategory(entry.name),
      totalCents: toCents(entry.amount),
      transactionCount: entry.transactionCount,
      percentage: entry.percentage,
    })),
  };
}

export function toSpendingTrends(response: TrendsResponse): SpendingTrends {
  return {
    interval: 'month',
    points: response.trends.map((trend) => ({
      periodStart: `${trend.month}-01`,
      totalCents: toCents(trend.totalSpent),
    })),
  };
}

/** Recognises the API's payment methods, e.g. "Debit Order", "EFT", "Credit Card". */
export function toChannel(paymentMethod: string): Transaction['channel'] {
  const method = paymentMethod.trim().toLowerCase();
  if (method.includes('debit order')) return 'debit_order';
  if (method === 'eft' || method.includes('transfer')) return 'eft';
  return 'card';
}

export function toTransactionPage(response: TransactionsResponse): TransactionPage {
  const { total, limit, offset } = response.pagination;

  return {
    items: response.transactions.map((transaction) => ({
      id: transaction.id,
      date: transaction.date,
      merchant: transaction.merchant,
      category: requireCategory(transaction.category),
      amountCents: toCents(Math.abs(transaction.amount)),
      // The API lists spending, so every transaction is money out
      type: 'debit',
      channel: toChannel(transaction.paymentMethod),
      description: transaction.description,
    })),
    // The UI thinks in pages; the API thinks in offsets
    page: Math.floor(offset / limit) + 1,
    pageSize: limit,
    totalItems: total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export function toGoals(response: GoalsResponse): Goal[] {
  return response.goals.map((goal) => ({
    id: goal.id,
    category: requireCategory(goal.category),
    budgetCents: toCents(goal.monthlyBudget),
    spentCents: toCents(goal.currentSpent),
    percentUsed: goal.percentageUsed,
    daysRemaining: goal.daysRemaining,
    status: goal.status,
  }));
}

// ---- Requests ----

/** The app's transaction query as the API's query parameters. */
export function toTransactionsParams({
  from,
  to,
  category,
  q,
  page = 1,
  pageSize = 20,
  sort = 'date_desc',
}: TransactionQuery) {
  return {
    startDate: from,
    endDate: to,
    category: category ? CATEGORY_API_NAMES[category] : undefined,
    search: q || undefined,
    sortBy: sort,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  };
}
