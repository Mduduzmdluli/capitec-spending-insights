import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { getErrorMessage } from '../../../api/client';
import { useTransactions } from '../../../api/hooks';
import type { DateRange, TransactionQuery } from '../../../api/schemas';
import { ErrorState } from '../../../components/ErrorState/ErrorState';
import { Panel } from '../../../components/Panel/Panel';
import { Skeleton } from '../../../components/Skeleton/Skeleton';
import { useDebouncedCallback } from '../../../lib/useDebouncedCallback';
import { Pagination } from './Pagination';
import { TransactionFilters } from './TransactionFilters';
import { TransactionList } from './TransactionList';
import styles from './Transactions.module.css';
import { useTransactionFilters } from './useTransactionFilters';

const PAGE_SIZE = 20;
const SEARCH_DELAY_MS = 300;
const countFormatter = new Intl.NumberFormat('en-ZA');

type TransactionsProps = {
  range: DateRange;
};

export function Transactions({ range }: TransactionsProps) {
  const { filters, update, reset, isFiltered } = useTransactionFilters();
  const [searchText, setSearchText] = useState(filters.q);
  const search = useDebouncedCallback((q: string) => update({ q }), SEARCH_DELAY_MS);
  const topRef = useRef<HTMLDivElement>(null);

  const query: TransactionQuery = {
    ...range,
    q: filters.q || undefined,
    category: filters.category ?? undefined,
    sort: filters.sort,
    page: filters.page,
    pageSize: PAGE_SIZE,
  };
  const { data, error, isPending, isError, isFetching, isPlaceholderData, refetch } =
    useTransactions(query);

  const handleSearchChange = (value: string) => {
    setSearchText(value);
    search.run(value);
  };

  const handleClear = () => {
    search.cancel(); // so a search still waiting to run can't undo the clear
    setSearchText('');
    reset();
  };

  const handlePageChange = (page: number) => {
    update({ page });
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    topRef.current?.scrollIntoView?.({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  let content: ReactNode;
  let summary = '';

  if (isPending) {
    content = <ListSkeleton />;
  } else if (isError) {
    content = (
      <ErrorState
        title="We couldn’t load your transactions"
        message={getErrorMessage(error)}
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  } else if (data.totalItems === 0) {
    content = isFiltered ? (
      <div className={styles.empty}>
        <p>No transactions match your filters.</p>
        <button type="button" className={styles.linkButton} onClick={handleClear}>
          Clear filters
        </button>
      </div>
    ) : (
      <p className={styles.empty}>No transactions in this period.</p>
    );
  } else {
    const first = (data.page - 1) * data.pageSize + 1;
    const last = first + data.items.length - 1;
    summary = `Showing ${countFormatter.format(first)}–${countFormatter.format(last)} of ${countFormatter.format(data.totalItems)} transactions`;

    content = (
      // Keep the current results visible, dimmed, while the next ones load
      <div
        className={styles.results}
        aria-busy={isPlaceholderData}
        data-stale={isPlaceholderData || undefined}
      >
        <TransactionList transactions={data.items} grouped={filters.sort.startsWith('date')} />
        <Pagination page={data.page} totalPages={data.totalPages} onPageChange={handlePageChange} />
      </div>
    );
  }

  return (
    <Panel title="Transactions" description={<span aria-live="polite">{summary}</span>}>
      <div ref={topRef} className={styles.scrollAnchor}>
        <TransactionFilters
          searchText={searchText}
          onSearchChange={handleSearchChange}
          category={filters.category}
          onCategoryChange={(category) => update({ category })}
          sort={filters.sort}
          onSortChange={(sort) => update({ sort })}
          canClear={isFiltered || searchText !== ''}
          onClear={handleClear}
        />
      </div>
      {content}
    </Panel>
  );
}

function ListSkeleton() {
  return (
    <div>
      <p role="status" className="visually-hidden">
        Loading transactions
      </p>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className={styles.skeletonRow}>
          <Skeleton width="2.25rem" height="2.25rem" className={styles.skeletonIcon} />
          <div className={styles.skeletonMain}>
            <Skeleton height="0.875rem" width="40%" />
            <Skeleton height="0.75rem" width="25%" />
          </div>
          <Skeleton height="1rem" width="5rem" />
        </div>
      ))}
    </div>
  );
}
