import { delay, http, HttpResponse } from 'msw';
import type { z } from 'zod';
import {
  dateRangeParamsSchema,
  transactionsParamsSchema,
  trendsParamsSchema,
} from '../api/schemas';
import {
  computeCategoryBreakdown,
  computeSummary,
  computeTrends,
  queryTransactions,
} from './data/aggregations';
import { getTransactions, MOCK_CUSTOMER } from './db';

const CUSTOMER_PATH = '*/api/customers/:customerId';

/** Lets reviewers preview edge cases in the browser, e.g. /?simulate=error or /?simulate=slow */
function simulationMode(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('simulate');
}

async function precheck(customerId: unknown): Promise<Response | undefined> {
  const mode = simulationMode();

  if (import.meta.env.MODE !== 'test') {
    await delay(mode === 'slow' ? 3000 : 'real');
  }
  if (mode === 'error') {
    return HttpResponse.json(
      { message: 'Something went wrong on our side. Please try again.' },
      { status: 500 },
    );
  }
  if (customerId !== MOCK_CUSTOMER.id) {
    return HttpResponse.json({ message: 'Customer not found' }, { status: 404 });
  }
  return undefined;
}

function parseQuery<TSchema extends z.ZodType>(request: Request, schema: TSchema) {
  return schema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
}

const badRequest = (message: string) => HttpResponse.json({ message }, { status: 400 });
const INVALID_RANGE = '"from" must be on or before "to"';

export const handlers = [
  http.get(CUSTOMER_PATH, async ({ params }) => {
    const failure = await precheck(params.customerId);
    if (failure) return failure;
    return HttpResponse.json(MOCK_CUSTOMER);
  }),

  http.get(`${CUSTOMER_PATH}/summary`, async ({ params, request }) => {
    const failure = await precheck(params.customerId);
    if (failure) return failure;
    const query = parseQuery(request, dateRangeParamsSchema);
    if (!query.success) return badRequest('Invalid query parameters');
    if (query.data.from > query.data.to) return badRequest(INVALID_RANGE);
    return HttpResponse.json(computeSummary(getTransactions(), query.data));
  }),

  http.get(`${CUSTOMER_PATH}/spending/trends`, async ({ params, request }) => {
    const failure = await precheck(params.customerId);
    if (failure) return failure;
    const query = parseQuery(request, trendsParamsSchema);
    if (!query.success) return badRequest('Invalid query parameters');
    if (query.data.from > query.data.to) return badRequest(INVALID_RANGE);
    return HttpResponse.json(computeTrends(getTransactions(), query.data, query.data.interval));
  }),

  http.get(`${CUSTOMER_PATH}/spending/categories`, async ({ params, request }) => {
    const failure = await precheck(params.customerId);
    if (failure) return failure;
    const query = parseQuery(request, dateRangeParamsSchema);
    if (!query.success) return badRequest('Invalid query parameters');
    if (query.data.from > query.data.to) return badRequest(INVALID_RANGE);
    return HttpResponse.json(computeCategoryBreakdown(getTransactions(), query.data));
  }),

  http.get(`${CUSTOMER_PATH}/transactions`, async ({ params, request }) => {
    const failure = await precheck(params.customerId);
    if (failure) return failure;
    const query = parseQuery(request, transactionsParamsSchema);
    if (!query.success) return badRequest('Invalid query parameters');
    if (query.data.from > query.data.to) return badRequest(INVALID_RANGE);
    return HttpResponse.json(queryTransactions(getTransactions(), query.data));
  }),
];
