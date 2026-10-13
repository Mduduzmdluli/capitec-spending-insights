import { ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { getErrorMessage } from '../../../api/client';
import { useCategoryBreakdown } from '../../../api/hooks';
import type {
  CategoryBreakdown as BreakdownData,
  CategoryId,
  DateRange,
} from '../../../api/schemas';
import { ErrorState } from '../../../components/ErrorState/ErrorState';
import { Money } from '../../../components/Money';
import { Panel } from '../../../components/Panel/Panel';
import { Skeleton } from '../../../components/Skeleton/Skeleton';
import { CATEGORIES } from '../../../lib/categories';
import { formatShare } from '../../../lib/formatPercent';
import {
  TRANSACTIONS_PANEL_ID,
  useTransactionFilters,
} from '../Transactions/useTransactionFilters';
import styles from './CategoryBreakdown.module.css';

type BreakdownItem = BreakdownData['categories'][number];

const INITIAL_VISIBLE = 5;
const countFormatter = new Intl.NumberFormat('en-ZA');

const formatPaymentCount = (count: number) =>
  `${countFormatter.format(count)} ${count === 1 ? 'payment' : 'payments'}`;

/** Bring the transactions list into view and move focus there for keyboard users. */
function goToTransactions() {
  const target = document.getElementById(TRANSACTIONS_PANEL_ID);
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  target?.scrollIntoView?.({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  target?.focus({ preventScroll: true });
}

type CategoryBreakdownProps = {
  range: DateRange;
};

export function CategoryBreakdown({ range }: CategoryBreakdownProps) {
  const { data, error, isPending, isError, isFetching, refetch } = useCategoryBreakdown(range);
  const { filters, update } = useTransactionFilters();

  const toggleCategory = (category: CategoryId) => {
    const next = filters.category === category ? null : category;
    update({ category: next });
    if (next) goToTransactions();
  };

  let content: ReactNode;
  if (isPending) {
    content = <BreakdownSkeleton />;
  } else if (isError) {
    content = (
      <ErrorState
        title="We couldn’t load your spending by category"
        message={getErrorMessage(error)}
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  } else if (data.categories.length === 0) {
    content = <p className={styles.empty}>No spending in this period.</p>;
  } else {
    content = (
      <CategoryList
        categories={data.categories}
        selected={filters.category}
        onSelect={toggleCategory}
      />
    );
  }

  return (
    <Panel title="Where it went" description="Select a category to see its transactions">
      {content}
    </Panel>
  );
}

type CategoryListProps = {
  categories: BreakdownItem[];
  selected: CategoryId | null;
  onSelect: (category: CategoryId) => void;
};

function CategoryList({ categories, selected, onSelect }: CategoryListProps) {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();

  const largest = Math.max(...categories.map((item) => item.totalCents));
  const hiddenCount = categories.length - INITIAL_VISIBLE;
  const visible = expanded ? categories : categories.slice(0, INITIAL_VISIBLE);

  return (
    <div className={styles.listWrap}>
      <ol id={listId} className={styles.list}>
        {visible.map((item) => (
          <CategoryRow
            key={item.category}
            item={item}
            largest={largest}
            selected={selected === item.category}
            onSelect={onSelect}
          />
        ))}
      </ol>

      {hiddenCount > 0 && (
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded
            ? 'Show fewer'
            : `Show ${hiddenCount} more ${hiddenCount === 1 ? 'category' : 'categories'}`}
          <ChevronDown
            className={`${styles.chevron} ${expanded ? styles.chevronOpen : ''}`}
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  );
}

type CategoryRowProps = {
  item: BreakdownItem;
  largest: number;
  selected: boolean;
  onSelect: (category: CategoryId) => void;
};

function CategoryRow({ item, largest, selected, onSelect }: CategoryRowProps) {
  const { label, icon: Icon, color } = CATEGORIES[item.category];
  // Bars are scaled against the largest category so differences are easy to compare
  const barWidth = largest > 0 ? (item.totalCents / largest) * 100 : 0;

  return (
    <li style={{ '--category-color': color } as CSSProperties}>
      {/* Buttons may only contain inline content, so the layout uses spans */}
      <button
        type="button"
        className={styles.rowButton}
        aria-pressed={selected}
        onClick={() => onSelect(item.category)}
      >
        <span className={styles.icon} aria-hidden="true">
          <Icon />
        </span>
        <span className={styles.details}>
          <span className={styles.line}>
            <span className={styles.name}>{label}</span>
            <Money cents={item.totalCents} className={styles.amount} />
          </span>
          <span className={styles.track} aria-hidden="true">
            <span className={styles.fill} style={{ width: `${barWidth}%` }} />
          </span>
          <span className={styles.meta}>
            <span>{formatPaymentCount(item.transactionCount)}</span>
            <span>
              {formatShare(item.percentage)}
              <span className="visually-hidden"> of spending</span>
            </span>
          </span>
        </span>
      </button>
    </li>
  );
}

function BreakdownSkeleton() {
  return (
    <div className={styles.list}>
      <p role="status" className="visually-hidden">
        Loading spending by category
      </p>
      {Array.from({ length: INITIAL_VISIBLE }, (_, i) => (
        <div key={i} className={styles.row}>
          <Skeleton width="2.25rem" height="2.25rem" className={styles.skeletonIcon} />
          <div className={styles.details}>
            <Skeleton height="1rem" width="70%" />
            <Skeleton height="0.5rem" />
          </div>
        </div>
      ))}
    </div>
  );
}
