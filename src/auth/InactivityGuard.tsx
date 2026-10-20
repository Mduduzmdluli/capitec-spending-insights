import { Clock } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import styles from './InactivityGuard.module.css';
import { useInactivityTimeout } from './useInactivityTimeout';

const STANDARD = { timeoutMs: 2 * 60_000, warningMs: 30_000 };
/** ?simulate=idle, so reviewers can see it without waiting five minutes */
const DEMO = { timeoutMs: 30_000, warningMs: 15_000 };

const settingsFromUrl = () =>
  new URLSearchParams(window.location.search).get('simulate') === 'idle' ? DEMO : STANDARD;

type InactivityGuardProps = {
  onTimeout: () => void;
  onSignOut: () => void;
  /** For tests: override the timings */
  timeoutMs?: number;
  warningMs?: number;
};

export function InactivityGuard({
  onTimeout,
  onSignOut,
  timeoutMs,
  warningMs,
}: InactivityGuardProps) {
  const defaults = settingsFromUrl();
  const { secondsLeft, stayActive } = useInactivityTimeout({
    timeoutMs: timeoutMs ?? defaults.timeoutMs,
    warningMs: warningMs ?? defaults.warningMs,
    onTimeout,
  });

  if (secondsLeft === null) return null;

  return <WarningDialog secondsLeft={secondsLeft} onStay={stayActive} onSignOut={onSignOut} />;
}

type WarningDialogProps = {
  secondsLeft: number;
  onStay: () => void;
  onSignOut: () => void;
};

function WarningDialog({ secondsLeft, onStay, onSignOut }: WarningDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stayRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  // showModal() makes the rest of the page unreachable and keeps focus inside the dialog
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    stayRef.current?.focus();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      // Escape means "I'm still here"
      onCancel={(event) => {
        event.preventDefault();
        onStay();
      }}
    >
      <Clock className={styles.icon} aria-hidden="true" />
      <h2 id={titleId} className={styles.title}>
        Are you still there?
      </h2>
      <p id={descriptionId} className={styles.text}>
        For your security, you’ll be signed out in{' '}
        <strong className={styles.countdown}>
          {secondsLeft} {secondsLeft === 1 ? 'second' : 'seconds'}
        </strong>{' '}
        unless you choose to stay.
      </p>
      <div className={styles.actions}>
        <button type="button" className={styles.secondary} onClick={onSignOut}>
          Sign out now
        </button>
        <button ref={stayRef} type="button" className={styles.primary} onClick={onStay}>
          Stay signed in
        </button>
      </div>
    </dialog>
  );
}
