import { format, parseISO } from 'date-fns';
import { ChevronDown, LogOut } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import type { FocusEvent } from 'react';
import { useCustomer } from '../../api/hooks';
import styles from './AccountMenu.module.css';

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

const capitalise = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

type AccountMenuProps = {
  onSignOut: () => void;
};

/** The signed-in customer's name in the header, opening a panel with their details. */
export function AccountMenu({ onSignOut }: AccountMenuProps) {
  const { data: customer, isPending, isError } = useCustomer();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // While open: close on a click outside, or on Escape (returning focus to the button)
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  // Close when keyboard focus moves somewhere else on the page
  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget;
    if (next && !event.currentTarget.contains(next)) setOpen(false);
  };

  if (isPending) return <div className={styles.skeleton} aria-hidden="true" />;

  // Without the profile there's nothing to show, but signing out must always be possible
  if (isError) {
    return (
      <button type="button" className={styles.headerSignOut} onClick={onSignOut}>
        <LogOut className={styles.icon} aria-hidden="true" />
        Sign out
      </button>
    );
  }

  const initials = initialsOf(customer.name);
  const accountType = capitalise(customer.accountType);

  return (
    <div ref={wrapperRef} className={styles.wrapper} onBlur={handleBlur}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={styles.avatar} aria-hidden="true">
          {initials}
        </span>
        <span className={styles.text}>
          <span className={styles.name}>{customer.name}</span>
          <span className={styles.type}>{`${accountType} account`}</span>
        </span>
        <ChevronDown
          className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div id={panelId} className={styles.panel} role="region" aria-label="Your account">
          <div className={styles.identity}>
            <span className={`${styles.avatar} ${styles.avatarLarge}`} aria-hidden="true">
              {initials}
            </span>
            <span className={styles.identityText}>
              <span className={styles.identityName}>{customer.name}</span>
              <span className={styles.email}>{customer.email}</span>
            </span>
          </div>

          <dl className={styles.details}>
            <div className={styles.detail}>
              <dt>Account</dt>
              <dd>{accountType}</dd>
            </div>
            <div className={styles.detail}>
              <dt>Customer since</dt>
              <dd>{format(parseISO(customer.joinDate), 'd MMMM yyyy')}</dd>
            </div>
          </dl>

          <button type="button" className={styles.signOut} onClick={onSignOut}>
            <LogOut className={styles.icon} aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
