import { useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { categoryIdSchema, transactionSortSchema } from '../../../api/schemas';
import type { CategoryId, TransactionSort } from '../../../api/schemas';

export type TransactionFilterState = {
  q: string;
  category: CategoryId | null;
  sort: TransactionSort;
  page: number;
};

const DEFAULT_SORT: TransactionSort = 'date_desc';

/** Search, category, sort and page, stored in the URL. Invalid values fall back to defaults. */
export function useTransactionFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const category = categoryIdSchema.safeParse(searchParams.get('category'));
  const sort = transactionSortSchema.safeParse(searchParams.get('sort'));
  const page = Number(searchParams.get('page'));

  const filters: TransactionFilterState = {
    q: searchParams.get('q') ?? '',
    category: category.success ? category.data : null,
    sort: sort.success ? sort.data : DEFAULT_SORT,
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };

  const update = useCallback(
    (changes: Partial<TransactionFilterState>) => {
      setSearchParams(
        (current) => {
          const params = new URLSearchParams(current);
          // Defaults are left out of the URL to keep it clean
          const set = (key: string, value: string | null | undefined, fallback: string) => {
            if (!value || value === fallback) params.delete(key);
            else params.set(key, value);
          };

          if ('q' in changes) set('q', changes.q?.trim(), '');
          if ('category' in changes) set('category', changes.category, '');
          if ('sort' in changes) set('sort', changes.sort, DEFAULT_SORT);

          // Any change other than an explicit page change goes back to the first page
          if ('page' in changes) set('page', String(changes.page ?? 1), '1');
          else params.delete('page');

          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const reset = useCallback(() => update({ q: '', category: null, sort: DEFAULT_SORT }), [update]);

  return { filters, update, reset, isFiltered: filters.q !== '' || filters.category !== null };
}
