import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Transactions.module.css';

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className={styles.pagination} aria-label="Transaction pages">
      <button
        type="button"
        className={styles.pageButton}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className={styles.buttonIcon} aria-hidden="true" />
        Previous
      </button>
      <span className={styles.pageStatus}>{`Page ${page} of ${totalPages}`}</span>
      <button
        type="button"
        className={styles.pageButton}
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
        <ChevronRight className={styles.buttonIcon} aria-hidden="true" />
      </button>
    </nav>
  );
}
