import { Search, X } from 'lucide-react';
import { useId } from 'react';
import { CATEGORY_IDS } from '../../../api/schemas';
import type { CategoryId, TransactionSort } from '../../../api/schemas';
import { CATEGORIES } from '../../../lib/categories';
import styles from './Transactions.module.css';

const SORT_OPTIONS: { value: TransactionSort; label: string }[] = [
  { value: 'date_desc', label: 'Newest first' },
  { value: 'date_asc', label: 'Oldest first' },
  { value: 'amount_desc', label: 'Highest amount' },
  { value: 'amount_asc', label: 'Lowest amount' },
];

type TransactionFiltersProps = {
  searchText: string;
  onSearchChange: (value: string) => void;
  category: CategoryId | null;
  onCategoryChange: (category: CategoryId | null) => void;
  sort: TransactionSort;
  onSortChange: (sort: TransactionSort) => void;
  canClear: boolean;
  onClear: () => void;
};

export function TransactionFilters({
  searchText,
  onSearchChange,
  category,
  onCategoryChange,
  sort,
  onSortChange,
  canClear,
  onClear,
}: TransactionFiltersProps) {
  const id = useId();

  return (
    <div className={styles.filters} role="search" aria-label="Filter transactions">
      <div className={styles.searchField}>
        <label htmlFor={`${id}-search`} className="visually-hidden">
          Search transactions
        </label>
        <Search className={styles.searchIcon} aria-hidden="true" />
        <input
          id={`${id}-search`}
          className={styles.searchInput}
          type="search"
          placeholder="Search by merchant"
          autoComplete="off"
          value={searchText}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <label htmlFor={`${id}-category`} className="visually-hidden">
        Category
      </label>
      <select
        id={`${id}-category`}
        className={styles.select}
        value={category ?? ''}
        onChange={(event) =>
          onCategoryChange(event.target.value === '' ? null : (event.target.value as CategoryId))
        }
      >
        <option value="">All categories</option>
        {CATEGORY_IDS.map((categoryId) => (
          <option key={categoryId} value={categoryId}>
            {CATEGORIES[categoryId].label}
          </option>
        ))}
      </select>

      <label htmlFor={`${id}-sort`} className="visually-hidden">
        Sort by
      </label>
      <select
        id={`${id}-sort`}
        className={styles.select}
        value={sort}
        onChange={(event) => onSortChange(event.target.value as TransactionSort)}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {canClear && (
        <button type="button" className={styles.clearButton} onClick={onClear}>
          <X className={styles.buttonIcon} aria-hidden="true" />
          Clear
        </button>
      )}
    </div>
  );
}
