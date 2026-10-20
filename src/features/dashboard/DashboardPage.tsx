import { useMemo } from 'react';
import { formatDateRange, getDateRange } from '../../lib/period';
import { CategoryBreakdown } from './CategoryBreakdown/CategoryBreakdown';
import styles from './DashboardPage.module.css';
import { PeriodSelector } from './PeriodSelector/PeriodSelector';
import { SpendingSummary } from './SpendingSummary/SpendingSummary';
import { SpendingTrend } from './SpendingTrend/SpendingTrend';
import { Transactions } from './Transactions/Transactions';
import { BudgetGoals } from './BudgetGoals/BudgetGoals.tsx';
import { usePeriod } from './usePeriod';
import { useFilters } from '../../api/hooks';

export function DashboardPage() {
  const [period, setPeriod] = usePeriod();
  const range = useMemo(() => getDateRange(period), [period]);
  const { data: filters } = useFilters();

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.heading}>
          <h1 className={styles.title}>Your spending</h1>
          <p className={styles.range} aria-live="polite">
            {formatDateRange(range)}
          </p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} available={filters?.periods} />
      </div>

      <SpendingSummary period={period} />

      <div className={styles.insights}>
        <SpendingTrend />
        <CategoryBreakdown period={period} />
      </div>
      <BudgetGoals />

      <Transactions range={range} />
    </div>
  );
}
