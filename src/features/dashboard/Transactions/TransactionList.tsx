import { format, parseISO } from 'date-fns';
import type { CSSProperties } from 'react';
import type { Transaction } from '../../../api/schemas';
import { Money } from '../../../components/Money';
import { CATEGORIES } from '../../../lib/categories';
import { groupByDay } from './groupByDay';
import styles from './Transactions.module.css';

const CHANNEL_BADGE: Record<Transaction['channel'], string | null> = {
  card: null,
  eft: 'EFT',
  debit_order: 'Debit order',
};

type TransactionListProps = {
  transactions: Transaction[];
  /** Group under day headings. Only meaningful when sorted by date. */
  grouped: boolean;
};

export function TransactionList({ transactions, grouped }: TransactionListProps) {
  if (!grouped) {
    return (
      <ul className={styles.rows}>
        {transactions.map((transaction) => (
          <TransactionRow key={transaction.id} transaction={transaction} showDate />
        ))}
      </ul>
    );
  }

  return (
    <div className={styles.groups}>
      {groupByDay(transactions).map((group) => (
        <div key={group.key} className={styles.group}>
          <h3 className={styles.dayHeading}>{group.label}</h3>
          <ul className={styles.rows}>
            {group.items.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function TransactionRow({
  transaction,
  showDate = false,
}: {
  transaction: Transaction;
  showDate?: boolean;
}) {
  const { label, icon: Icon, color } = CATEGORIES[transaction.category];
  const isCredit = transaction.type === 'credit';
  const badge = CHANNEL_BADGE[transaction.channel];

  return (
    <li className={styles.row} style={{ '--category-color': color } as CSSProperties}>
      <span className={styles.rowIcon} aria-hidden="true">
        <Icon />
      </span>

      <div className={styles.rowMain}>
        <span className={styles.merchant}>{transaction.merchant}</span>
        <span className={styles.rowMeta}>
          <span>{label}</span>
          {badge && <span className={styles.badge}>{badge}</span>}
        </span>
      </div>

      <div className={styles.rowEnd}>
        <span className={isCredit ? styles.credit : styles.debit}>
          {/* Screen readers hear "Spent" or "Received" instead of a bare symbol */}
          <span className="visually-hidden">{isCredit ? 'Received ' : 'Spent '}</span>
          <span aria-hidden="true">{isCredit ? '+' : '−'}</span>
          <Money cents={transaction.amountCents} />
        </span>
        <time className={styles.time} dateTime={transaction.date}>
          {format(parseISO(transaction.date), showDate ? 'd MMM yyyy, HH:mm' : 'HH:mm')}
        </time>
      </div>
    </li>
  );
}
