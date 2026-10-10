import { useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { DEFAULT_PERIOD, isPeriod } from '../../lib/period';
import type { Period } from '../../lib/period';

const PARAM = 'period';

/** The selected period, stored in the URL so views can be shared and survive a refresh. */
export function usePeriod() {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get(PARAM);
  const period: Period = isPeriod(raw) ? raw : DEFAULT_PERIOD;

  const setPeriod = useCallback(
    (next: Period) => {
      setSearchParams(
        (current) => {
          // Copy, so other parameters (such as ?simulate=) are kept
          const params = new URLSearchParams(current);
          if (next === DEFAULT_PERIOD) params.delete(PARAM);
          else params.set(PARAM, next);
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return [period, setPeriod] as const;
}
