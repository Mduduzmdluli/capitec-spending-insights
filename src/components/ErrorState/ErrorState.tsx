import { CircleAlert, RotateCw } from 'lucide-react';
import styles from './ErrorState.module.css';

type ErrorStateProps = {
  title: string;
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
};

export function ErrorState({ title, message, onRetry, isRetrying = false }: ErrorStateProps) {
  return (
    <div className={styles.error} role="alert">
      <CircleAlert className={styles.icon} aria-hidden="true" />
      <div className={styles.body}>
        <p className={styles.title}>{title}</p>
        {message && <p className={styles.message}>{message}</p>}
        {onRetry && (
          <button type="button" className={styles.retry} onClick={onRetry} disabled={isRetrying}>
            <RotateCw className={styles.retryIcon} aria-hidden="true" />
            {isRetrying ? 'Trying again…' : 'Try again'}
          </button>
        )}
      </div>
    </div>
  );
}
