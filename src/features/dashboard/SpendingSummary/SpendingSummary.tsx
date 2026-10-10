import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { useId } from 'react';
import type { ReactNode } from 'react';
import { getErrorMessage } from '../../../api/client';
import { useSpendingSummary } from '../../../api/hooks';
import type { DateRange, SpendingSummary as SummaryData } from '../../../api/schemas';
import { ErrorState } from '../../../components/ErrorState/ErrorState';
import { Money } from '../../../components/Money';
import { Skeleton } from '../../../components/Skeleton/Skeleton';
import { CATEGORIES } from '../../../lib/categories';
import { getPeriodLabel } from '../../../lib/period';
import type { Period } from '../../../lib/period';
import { describeChange } from './describeChange';
import type { Change } from './describeChange';
import styles from './SpendingSummary.module.css';

const countFormatter = new Intl.NumberFormat('en-ZA');

type SpendingSummaryProps = {
  period: Period;
  range: DateRange;
};

export function SpendingSummary({ period, range }: SpendingSummaryProps) {
  const headingId = useId();
  const { data, error, isPending, isError, isFetching, refetch } = useSpendingSummary(range);
  const label = getPeriodLabel(period);

  let content: ReactNode;
  if (isPending) {
    content = <SummarySkeleton />;
  } else if (isError) {
    content = (
      <ErrorState
        title="We couldn’t load your spending summary"
        message={getErrorMessage(error)}
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  } else {
    content = <SummaryContent summary={data} label={label} />;
  }

  return (
    <section className={styles.summary} aria-labelledby={headingId}>
      <h2 id={headingId} className="visually-hidden">
        Spending summary
      </h2>
      {content}
    </section>
  );
}

function SummaryContent({ summary, label }: { summary: SummaryData; label: string }) {
  const hasSpending = summary.transactionCount > 0;
  const change = describeChange(summary.totalSpentCents, summary.previousPeriodSpentCents);

  return (
    <>
      <p className={styles.headline}>
        {hasSpending ? (
          <>
            You’ve spent <Money cents={summary.totalSpentCents} className={styles.amount} /> in the
            last {label}.
          </>
        ) : (
          `You haven’t spent anything in the last ${label}.`
        )}
      </p>

      <ChangeNote change={change} label={label} />

      {hasSpending && (
        <dl className={styles.stats}>
          <div className={styles.stat}>
            <dt>Payments</dt>
            <dd>{countFormatter.format(summary.transactionCount)}</dd>
          </div>
          <div className={styles.stat}>
            <dt>Average payment</dt>
            <dd>
              <Money cents={summary.averageTransactionCents} />
            </dd>
          </div>
          {summary.topCategory && (
            <div className={styles.stat}>
              <dt>Most spent on</dt>
              <dd>{CATEGORIES[summary.topCategory].label}</dd>
            </div>
          )}
        </dl>
      )}
    </>
  );
}

function ChangeNote({ change, label }: { change: Change; label: string }) {
  const comparison = `the previous ${label}`;

  if (change.kind === 'none') {
    return (
      <p className={styles.change}>{`There’s no spending in ${comparison} to compare with.`}</p>
    );
  }

  if (change.kind === 'same') {
    return (
      <p className={styles.change}>
        <Minus className={styles.icon} aria-hidden="true" />
        {`About the same as ${comparison}.`}
      </p>
    );
  }

  const isUp = change.kind === 'up';
  const Icon = isUp ? ArrowUpRight : ArrowDownRight;

  return (
    <p className={`${styles.change} ${isUp ? styles.up : styles.down}`}>
      <Icon className={styles.icon} aria-hidden="true" />
      {`That’s ${change.percent}% ${isUp ? 'more' : 'less'} than ${comparison}.`}
    </p>
  );
}

function SummarySkeleton() {
  return (
    <div className={styles.loading}>
      <p role="status" className="visually-hidden">
        Loading your spending summary
      </p>
      <Skeleton height="2.5rem" width="36rem" />
      <Skeleton height="2.5rem" width="22rem" />
      <Skeleton height="2rem" width="18rem" className={styles.skeletonPill} />
      <div className={styles.stats}>
        {[0, 1, 2].map((i) => (
          <div key={i} className={styles.stat}>
            <Skeleton height="0.875rem" width="6rem" />
            <Skeleton height="1.75rem" width="8rem" />
          </div>
        ))}
      </div>
    </div>
  );
}
