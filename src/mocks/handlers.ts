import { delay, http, HttpResponse } from 'msw';
import type { z } from 'zod';
import { toRand } from '../api/adapters';
import {
  CATEGORY_API_NAMES,
  categoriesQuerySchema,
  categoryIdFromApiName,
  summaryQuerySchema,
  transactionsQuerySchema,
  trendsQuerySchema,
} from '../api/contract';
import type { Transaction } from '../api/schemas';
import { loginRequestSchema } from '../api/schemas';
import { getDateRange } from '../lib/period';
import {
  computeCategoryBreakdown,
  computeGoalProgress,
  computeMonthlyTrends,
  computeSummary,
  listTransactions,
  previousRange,
} from './data/aggregations';
import { CATEGORY_STYLES } from './data/categoryStyles';
import { findUser, findUserByUsername, getTransactions } from './db';
import { clearAttempts, lockoutMinutesRemaining, recordFailedAttempt } from './loginAttempts';
import { createSession, deleteSession, touchSession } from './sessions';

const CUSTOMER_PATH = '*/api/customers/:customerId';
const isTest = import.meta.env.MODE === 'test';

/** Lets reviewers preview edge cases in the browser, e.g. /?simulate=error or /?simulate=slow */
function simulationMode(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('simulate');
}

const errorResponse = (status: number, message: string) =>
  HttpResponse.json({ message }, { status });

const badRequest = (message: string) => errorResponse(400, message);

/** The token from an "Authorization: Bearer <token>" header, if present. */
export function bearerToken(request: Request): string | null {
  const header = request.headers.get('Authorization');
  return header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
}

/**
 * Shared checks for every data endpoint, in order: simulated latency and errors,
 * then a valid session, then that the session belongs to the customer in the URL.
 */
async function precheck(request: Request, customerId: unknown): Promise<Response | undefined> {
  const mode = simulationMode();

  if (!isTest) {
    await delay(mode === 'slow' ? 3000 : 'real');
  }
  if (mode === 'error') {
    return errorResponse(500, 'Something went wrong on our side. Please try again.');
  }

  // 401: no token, an unknown token, or an expired session
  const token = bearerToken(request);
  const session = token ? touchSession(token) : null;
  if (!session) {
    return errorResponse(401, 'Your session has expired. Please sign in again.');
  }

  // 403: whose data you may see comes from the session, never from the URL. The same
  // answer for any other ID, whether or not it exists, so IDs can't be probed either.
  if (customerId !== session.customerId) {
    return errorResponse(403, 'You do not have access to this account.');
  }

  return undefined;
}

function parseQuery<TSchema extends z.ZodType>(request: Request, schema: TSchema) {
  return schema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
}

// ---- Converting results into the documented format ----

/** Percentage change to one decimal place, or null when there's nothing to compare with. */
function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

const PAYMENT_METHODS: Record<Transaction['channel'], string> = {
  card: 'Debit Card',
  debit_order: 'Debit Order',
  eft: 'EFT',
};

function toApiTransaction(transaction: Transaction) {
  const style = CATEGORY_STYLES[transaction.category];
  return {
    id: transaction.id,
    date: transaction.date,
    merchant: transaction.merchant,
    category: CATEGORY_API_NAMES[transaction.category],
    amount: toRand(transaction.amountCents),
    description: transaction.channel === 'debit_order' ? 'Monthly debit order' : undefined,
    paymentMethod: PAYMENT_METHODS[transaction.channel],
    icon: style.icon,
    categoryColor: style.color,
  };
}

// ---- Signing in and out (an addition beyond the documented API) ----

const authHandlers = [
  http.post('*/api/auth/login', async ({ request }) => {
    if (!isTest) await delay('real');

    const body = loginRequestSchema.safeParse(await request.json().catch(() => null));
    if (!body.success) return badRequest('Enter your username and password.');

    const username = body.data.username.toLowerCase();
    const minutesLeft = lockoutMinutesRemaining(username);
    if (minutesLeft > 0) {
      return errorResponse(
        429,
        `Too many unsuccessful attempts. Try again in ${minutesLeft} ${minutesLeft === 1 ? 'minute' : 'minutes'}.`,
      );
    }

    const user = findUserByUsername(username);
    // One message for both cases, so attackers can't discover which usernames exist
    if (!user || user.password !== body.data.password) {
      recordFailedAttempt(username);
      return errorResponse(401, 'The username or password is incorrect.');
    }

    clearAttempts(username);
    const session = createSession(user.id);
    return HttpResponse.json({
      token: session.token,
      expiresAt: new Date(session.expiresAt).toISOString(),
      customer: { id: user.id, name: user.name },
    });
  }),

  http.post('*/api/auth/logout', ({ request }) => {
    const token = bearerToken(request);
    if (token) deleteSession(token);
    return new HttpResponse(null, { status: 204 });
  }),
];

// ---- The documented endpoints: each requires the customer's own session ----

const dataHandlers = [
  // 1. Customer profile
  http.get(`${CUSTOMER_PATH}/profile`, async ({ params, request }) => {
    const failure = await precheck(request, params.customerId);
    if (failure) return failure;

    const user = findUser(String(params.customerId));
    if (!user) return errorResponse(404, 'Customer not found');

    const spentCents = getTransactions(user.id)
      .filter((t) => t.type === 'debit')
      .reduce((total, t) => total + t.amountCents, 0);

    return HttpResponse.json({
      customerId: user.id,
      name: user.name,
      email: user.email,
      joinDate: user.joinDate,
      accountType: user.accountType,
      totalSpent: toRand(spentCents),
      currency: 'ZAR',
    });
  }),

  // 2. Spending summary
  http.get(`${CUSTOMER_PATH}/spending/summary`, async ({ params, request }) => {
    const failure = await precheck(request, params.customerId);
    if (failure) return failure;
    const query = parseQuery(request, summaryQuerySchema);
    if (!query.success) return badRequest('Invalid query parameters');

    const transactions = getTransactions(String(params.customerId));
    const range = getDateRange(query.data.period);
    const current = computeSummary(transactions, range);
    const previous = computeSummary(transactions, previousRange(range));

    return HttpResponse.json({
      period: query.data.period,
      totalSpent: toRand(current.totalSpentCents),
      transactionCount: current.transactionCount,
      averageTransaction: toRand(current.averageTransactionCents),
      topCategory: current.topCategory ? CATEGORY_API_NAMES[current.topCategory] : null,
      comparedToPrevious: {
        spentChange: percentChange(current.totalSpentCents, previous.totalSpentCents),
        transactionChange: percentChange(current.transactionCount, previous.transactionCount),
      },
    });
  }),

  // 3. Spending by category, for a period or a custom date range
  http.get(`${CUSTOMER_PATH}/spending/categories`, async ({ params, request }) => {
    const failure = await precheck(request, params.customerId);
    if (failure) return failure;
    const query = parseQuery(request, categoriesQuerySchema);
    if (!query.success) return badRequest('Invalid query parameters');

    const { period, startDate, endDate } = query.data;
    if ((startDate && !endDate) || (!startDate && endDate)) {
      return badRequest('Provide both startDate and endDate, or neither');
    }
    if (startDate && endDate && startDate > endDate) {
      return badRequest('startDate must be on or before endDate');
    }

    // A custom range takes priority over the period
    const range = startDate && endDate ? { from: startDate, to: endDate } : getDateRange(period);
    const { categories } = computeCategoryBreakdown(
      getTransactions(String(params.customerId)),
      range,
    );
    const totalCents = categories.reduce((total, entry) => total + entry.totalCents, 0);

    return HttpResponse.json({
      dateRange: { startDate: range.from, endDate: range.to },
      totalAmount: toRand(totalCents),
      categories: categories.map((entry) => ({
        name: CATEGORY_API_NAMES[entry.category],
        amount: toRand(entry.totalCents),
        percentage: entry.percentage,
        transactionCount: entry.transactionCount,
        ...CATEGORY_STYLES[entry.category],
      })),
    });
  }),

  // 4. Monthly spending trends
  http.get(`${CUSTOMER_PATH}/spending/trends`, async ({ params, request }) => {
    const failure = await precheck(request, params.customerId);
    if (failure) return failure;
    const query = parseQuery(request, trendsQuerySchema);
    if (!query.success) return badRequest('months must be a whole number from 1 to 24');

    const trends = computeMonthlyTrends(
      getTransactions(String(params.customerId)),
      query.data.months,
    );

    return HttpResponse.json({
      trends: trends.map((trend) => ({
        month: trend.month,
        totalSpent: toRand(trend.totalCents),
        transactionCount: trend.transactionCount,
        averageTransaction:
          trend.transactionCount > 0
            ? toRand(Math.round(trend.totalCents / trend.transactionCount))
            : 0,
      })),
    });
  }),

  // 5. Transactions, with filtering and offset pagination
  http.get(`${CUSTOMER_PATH}/transactions`, async ({ params, request }) => {
    const failure = await precheck(request, params.customerId);
    if (failure) return failure;
    const query = parseQuery(request, transactionsQuerySchema);
    if (!query.success) return badRequest('Invalid query parameters');

    const { limit, offset, category, startDate, endDate, sortBy, search } = query.data;

    const categoryId = category ? categoryIdFromApiName(category) : undefined;
    if (category && !categoryId) return badRequest(`Unknown category "${category}"`);
    if (startDate && endDate && startDate > endDate) {
      return badRequest('startDate must be on or before endDate');
    }

    // Either end of the range may be left open
    const range =
      startDate || endDate
        ? { from: startDate ?? '0000-01-01', to: endDate ?? '9999-12-31' }
        : undefined;

    const { items, total } = listTransactions(getTransactions(String(params.customerId)), {
      range,
      category: categoryId,
      search,
      sort: sortBy,
      offset,
      limit,
    });

    return HttpResponse.json({
      transactions: items.map(toApiTransaction),
      pagination: { total, limit, offset, hasMore: offset + items.length < total },
    });
  }),

  // 6. Spending goals, for the current calendar month
  http.get(`${CUSTOMER_PATH}/goals`, async ({ params, request }) => {
    const failure = await precheck(request, params.customerId);
    if (failure) return failure;

    const customerId = String(params.customerId);
    const goals = computeGoalProgress(
      getTransactions(customerId),
      findUser(customerId)?.goals ?? [],
    );

    return HttpResponse.json({
      goals: goals.map((goal) => ({
        id: goal.id,
        category: CATEGORY_API_NAMES[goal.category],
        monthlyBudget: toRand(goal.monthlyBudgetCents),
        currentSpent: toRand(goal.spentCents),
        percentageUsed: goal.percentageUsed,
        daysRemaining: goal.daysRemaining,
        status: goal.status,
      })),
    });
  }),
];

export const handlers = [...authHandlers, ...dataHandlers];
