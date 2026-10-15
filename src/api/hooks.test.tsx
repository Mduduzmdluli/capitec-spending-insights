import { renderHook, waitFor } from '@testing-library/react';
import { format, subDays } from 'date-fns';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../mocks/server';
import { createTestWrapper } from '../test/render';
import { ApiError, InvalidResponseError } from './client';
import { useSpendingSummary } from './hooks';

const today = new Date();
const lastThirtyDays = {
  from: format(subDays(today, 29), 'yyyy-MM-dd'),
  to: format(today, 'yyyy-MM-dd'),
};

const SUMMARY_URL = '*/api/customers/:customerId/summary';

const renderSummaryHook = () =>
  renderHook(() => useSpendingSummary(lastThirtyDays), { wrapper: createTestWrapper().Wrapper });

describe('useSpendingSummary', () => {
  it('returns a validated summary from the API', async () => {
    const { result } = renderSummaryHook();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.from).toBe(lastThirtyDays.from);
    expect(result.current.data?.totalSpentCents).toBeGreaterThan(0);
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

  it('rejects responses that do not match the contract', async () => {
    server.use(http.get(SUMMARY_URL, () => HttpResponse.json({ unexpected: true })));
    const { result } = renderSummaryHook();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(InvalidResponseError);
  });
});
