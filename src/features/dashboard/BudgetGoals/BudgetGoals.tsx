import { format } from 'date-fns';
import type { CSSProperties, ReactNode } from 'react';
import { getErrorMessage } from '../../../api/client';
import { useGoals } from '../../../api/hooks';
import type { Goal, GoalStatus } from '../../../api/schemas';
import { ErrorState } from '../../../components/ErrorState/ErrorState';
import { Money } from '../../../components/Money';
import { Panel } from '../../../components/Panel/Panel';
import { Skeleton } from '../../../components/Skeleton/Skeleton';
import { CATEGORIES } from '../../../lib/categories';
import styles from './BudgetGoals.module.css';

/** Written out and coloured, so colour is never the only signal. */
const STATUS: Record<GoalStatus, { label: string; color: string; urgency: number }> = {
  exceeded: { label: 'Over budget', color: 'var(--color-up)', urgency: 0 },
  warning: { label: 'Close to limit', color: 'var(--color-warn)', urgency: 1 },
  on_track: { label: 'On track', color: 'var(--color-down)', urgency: 2 },
};

/** Most urgent first, then the most used. */
const byUrgency = (a: Goal, b: Goal) =>
  STATUS[a.status].urgency - STATUS[b.status].urgency || b.percentUsed - a.percentUsed;

const formatDaysLeft = (days: number) =>
  days === 0 ? 'Last day of the month' : `${days} ${days === 1 ? 'day' : 'days'} left`;

export function BudgetGoals() {
  const { data, error, isPending, isError, isFetching, refetch } = useGoals();
  const month = format(new Date(), 'MMMM yyyy');

  let content: ReactNode;
  if (isPending) {
    content = <GoalsSkeleton />;
  } else if (isError) {
    content = (
      <ErrorState
        title="We couldn’t load your budgets"
        message={getErrorMessage(error)}
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  } else if (data.length === 0) {
    content = <p className={styles.empty}>You haven’t set any monthly budgets yet.</p>;
  } else {
    content = (
      <ul className={styles.list}>
        {[...data].sort(byUrgency).map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </ul>
    );
  }

  return (
    <Panel title="Monthly budgets" description={`How you’re doing in ${month}`}>
      {content}
    </Panel>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const { label, icon: Icon, color } = CATEGORIES[goal.category];
  const status = STATUS[goal.status];
  const remainingCents = goal.budgetCents - goal.spentCents;
  // The bar fills up to the budget; anything over is shown in words
  const barWidth = Math.min(goal.percentUsed, 100);

  return (
    <li
      className={styles.goal}
      style={{ '--category-color': color, '--goal-color': status.color } as CSSProperties}
    >
      <div className={styles.top}>
        <span className={styles.icon} aria-hidden="true">
          <Icon />
        </span>
        <span className={styles.name}>{label}</span>
        <span className={styles.status}>{status.label}</span>
      </div>

      <p className={styles.amounts}>
        <Money cents={goal.spentCents} className={styles.spent} />
        <span className={styles.of}>
          of <Money cents={goal.budgetCents} />
        </span>
      </p>

      <div className={styles.track} aria-hidden="true">
        <span className={styles.fill} style={{ width: `${barWidth}%` }} />
      </div>

      <p className={styles.meta}>
        <span>
          {remainingCents >= 0 ? (
            <>
              <Money cents={remainingCents} /> left
            </>
          ) : (
            <>
              <Money cents={-remainingCents} /> over budget
            </>
          )}
        </span>
        <span>{formatDaysLeft(goal.daysRemaining)}</span>
      </p>
    </li>
  );
}

function GoalsSkeleton() {
  return (
    <div className={styles.list}>
      <p role="status" className="visually-hidden">
        Loading your budgets
      </p>
      {[0, 1, 2].map((i) => (
        <div key={i} className={styles.goal}>
          <Skeleton height="1.25rem" width="60%" />
          <Skeleton height="1.5rem" width="45%" />
          <Skeleton height="0.5rem" />
        </div>
      ))}
    </div>
  );
}
