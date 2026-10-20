import { LogOut } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useCustomer } from '../../api/hooks';
import { useAuth } from '../../auth/useAuth';
import styles from './AppShell.module.css';

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    // Deliberately not remembering this page: the next person to sign in starts fresh
    navigate('/login', { replace: true });
  };

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#main">
        Skip to main content
      </a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <span className={styles.logoTile}>
              <picture>
                {/* Phones get the compact mark; wider screens get the full wordmark */}
                <source media="(max-width: 40rem)" srcSet="/favicon.svg" />
                <img className={styles.logo} src="/logo.svg" alt="Capitec" />
              </picture>
            </span>
            <span className={styles.productName}>Spending insights</span>
          </div>
          <div className={styles.accountArea}>
            <CustomerBadge />
            <button type="button" className={styles.signOut} onClick={handleSignOut}>
              <LogOut className={styles.signOutIcon} aria-hidden="true" />
              <span className={styles.signOutLabel}>Sign out</span>
            </button>
          </div>
        </div>
      </header>
      <main id="main" className={styles.main} tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}

function CustomerBadge() {
  const { data, isPending, isError } = useCustomer();

  // The header still works without the customer's details, so fail quietly here
  if (isError) return null;
  if (isPending) return <div className={styles.customerSkeleton} aria-hidden="true" />;

  const initials = data.name
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const accountType = `${data.accountType.charAt(0).toUpperCase()}${data.accountType.slice(1)} account`;

  return (
    <div className={styles.customer}>
      <span className={styles.avatar} aria-hidden="true">
        {initials}
      </span>
      <span className={styles.customerText}>
        <span className={styles.customerName}>{data.name}</span>
        <span className={styles.account}>{accountType}</span>
      </span>
    </div>
  );
}
