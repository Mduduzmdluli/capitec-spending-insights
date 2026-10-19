import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../mocks/server';
import { createTestWrapper } from '../test/render';
import { ApiError, InvalidResponseError } from './client';
import type { SummaryResponse } from './contract';
import { useSpendingSummary } from './hooks';

const SUMMARY_URL = '*/api/customers/:customerId/spending/summary';

const validSummary: SummaryResponse = {
  period: '30d',
  totalSpent: 4250.75,
  transactionCount: 47,
  averageTransaction: 90.44,
  topCategory: 'Groceries',
  comparedToPrevious: { spentChange: 12.5, transactionChange: -3.2 },
};

const renderSummaryHook = () =>
  renderHook(() => useSpendingSummary('30d'), { wrapper: createTestWrapper().Wrapper });

describe('useSpendingSummary', () => {
  it('returns the summary from the mock API in the app model', async () => {
    const { result } = renderSummaryHook();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.totalSpentCents).toBeGreaterThan(0);
    expect(result.current.data?.transactionCount).toBeGreaterThan(0);
  });

  it('surfaces server errors as ApiError with the status and message', async () => {
    server.use(
      http.get(SUMMARY_URL, () =>
        HttpResponse.json({ message: 'Service unavailable' }, { status: 503 }),
      ),
    );
    const { result } = renderSummaryHook();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error).toMatchObject({ status: 503, message: 'Service unavailable' });
  });

  it('rejects responses that do not match the documented contract', async () => {
    server.use(http.get(SUMMARY_URL, () => HttpResponse.json({ unexpected: true })));
    const { result } = renderSummaryHook();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(InvalidResponseError);
  });

  it('rejects a category the app does not know', async () => {
    server.use(
      http.get(SUMMARY_URL, () => HttpResponse.json({ ...validSummary, topCategory: 'Gambling' })),
    );
    const { result } = renderSummaryHook();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(InvalidResponseError);
  });
});
