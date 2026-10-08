import styles from './DashboardPage.module.css';

export function DashboardPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Your spending</h1>
      <p className={styles.lead}>
        See where your money goes, spot changes early, and find any transaction fast.
      </p>
    </div>
  );
}
