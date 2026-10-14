import { delay, http, HttpResponse } from 'msw';
import type { z } from 'zod';
import {
  dateRangeParamsSchema,
  transactionsParamsSchema,
  trendsParamsSchema,
  loginRequestSchema,
} from '../api/schemas';
import {
  computeCategoryBreakdown,
  computeSummary,
  computeTrends,
  queryTransactions,
} from './data/aggregations';
import { findCustomer, findUserByUsername, getTransactions } from './db';
import { clearAttempts, lockoutMinutesRemaining, recordFailedAttempt } from './loginAttempts.ts';
import { createSession, deleteSession } from './sessions.ts';

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
const INVALID_RANGE = '"from" must be on or before "to"';

/** The token from an "Authorization: Bearer <token>" header, if present. */
export function bearerToken(request: Request): string | null {
  const header = request.headers.get('Authorization');
  return header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
}

async function precheck(customerId: unknown): Promise<Response | undefined> {
  const mode = simulationMode();

  if (import.meta.env.MODE !== 'test') {
    await delay(mode === 'slow' ? 3000 : 'real');
  }
  if (mode === 'error') {
    return errorResponse(500, 'Something went wrong on our side. Please try again.');
  }
  if (typeof customerId !== 'string' || !findCustomer(customerId)) {
    return errorResponse(404, 'Customer  not found');
  }
  return undefined;
}

function parseQuery<TSchema extends z.ZodType>(request: Request, schema: TSchema) {
  return schema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
}

// ---- Signing in and out ----

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
    const session = createSession(user.customer.id);
    return HttpResponse.json({
      token: session.token,
      expiresAt: new Date(session.expiresAt).toISOString(),
      customer: user.customer,
    });
  }),

  http.post('*/api/auth/logout', ({ request }) => {
    const token = bearerToken(request);
    if (token) deleteSession(token);
    return new HttpResponse(null, { status: 204 });
  }),
];

// ---- Customer data ----

const dataHandlers = [
  http.get(CUSTOMER_PATH, async ({ params }) => {
    const failure = await precheck(params.customerId);
    if (failure) return failure;
    return HttpResponse.json(findCustomer(String(params.customerId)) ?? null);
  }),

  http.get(`${CUSTOMER_PATH}/summary`, async ({ params, request }) => {
    const failure = await precheck(params.customerId);
    if (failure) return failure;
    const query = parseQuery(request, dateRangeParamsSchema);
    if (!query.success) return badRequest('Invalid query parameters');
    if (query.data.from > query.data.to) return badRequest(INVALID_RANGE);
    return HttpResponse.json(
      computeSummary(getTransactions(String(params.customerId)), query.data),
    );
  }),

  http.get(`${CUSTOMER_PATH}/spending/trends`, async ({ params, request }) => {
    const failure = await precheck(params.customerId);
    if (failure) return failure;
    const query = parseQuery(request, trendsParamsSchema);
    if (!query.success) return badRequest('Invalid query parameters');
    if (query.data.from > query.data.to) return badRequest(INVALID_RANGE);
    return HttpResponse.json(
      computeTrends(getTransactions(String(params.customerId)), query.data, query.data.interval),
    );
  }),

  http.get(`${CUSTOMER_PATH}/spending/categories`, async ({ params, request }) => {
    const failure = await precheck(params.customerId);
    if (failure) return failure;
    const query = parseQuery(request, dateRangeParamsSchema);
    if (!query.success) return badRequest('Invalid query parameters');
    if (query.data.from > query.data.to) return badRequest(INVALID_RANGE);
    return HttpResponse.json(
      computeCategoryBreakdown(getTransactions(String(params.customerId)), query.data),
    );
  }),

  http.get(`${CUSTOMER_PATH}/transactions`, async ({ params, request }) => {
    const failure = await precheck(params.customerId);
    if (failure) return failure;
    const query = parseQuery(request, transactionsParamsSchema);
    if (!query.success) return badRequest('Invalid query parameters');
    if (query.data.from > query.data.to) return badRequest(INVALID_RANGE);
    return HttpResponse.json(
      queryTransactions(getTransactions(String(params.customerId)), query.data),
    );
  }),
];

export const handlers = [...authHandlers, ...dataHandlers];
