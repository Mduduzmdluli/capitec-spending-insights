import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../auth/useAuth';
import { AccountMenu } from './AccountMenu';
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
          <AccountMenu onSignOut={handleSignOut} />
        </div>
      </header>
      <main id="main" className={styles.main} tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
