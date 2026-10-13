import { useMemo } from 'react';
import { formatDateRange, getDateRange } from '../../lib/period';
import styles from './DashboardPage.module.css';
import { PeriodSelector } from './PeriodSelector/PeriodSelector';
import { SpendingSummary } from './SpendingSummary/SpendingSummary.tsx';
import { SpendingTrend } from './SpendingTrend/SpendingTrend.tsx';
import { CategoryBreakdown } from './CategoryBreakdown/CategoryBreakdown.tsx';
import { Transactions } from './Transactions/Transactions';
import { usePeriod } from './usePeriod';

export function DashboardPage() {
  const [period, setPeriod] = usePeriod();
  const range = useMemo(() => getDateRange(period), [period]);

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.heading}>
          <h1 className={styles.title}>Your spending</h1>
          <p className={styles.range} aria-live="polite">
            {formatDateRange(range)}
          </p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <SpendingSummary period={period} range={range} />

      <div className={styles.insights}>
        <SpendingTrend period={period} range={range} />
        <CategoryBreakdown range={range} />
      </div>
      <Transactions range={range} />
    </div>
  );
}
