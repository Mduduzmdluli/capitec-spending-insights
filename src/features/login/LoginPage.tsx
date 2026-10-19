import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router';
import type { Location } from 'react-router';
import { getErrorMessage } from '../../api/client';
import type { SignOutReason } from '../../auth/AuthContext';
import { useAuth } from '../../auth/useAuth';
import { MOCK_USERS } from '../../mocks/data/customers';
import styles from './LoginPage.module.css';

const SIGN_OUT_MESSAGES: Record<SignOutReason, string> = {
  'signed-out': 'You’ve signed out.',
  expired: 'Your session has expired. Please sign in again.',
};

/** Only shown while the mock API is in use, so reviewers can try both customers. */
const showDemoAccounts = import.meta.env.VITE_ENABLE_MOCKS !== 'false';
const DEMO_ACCOUNTS = MOCK_USERS.map((user) => ({
  name: user.name,
  username: user.username,
  password: user.password,
}));

type FieldErrors = { username?: string; password?: string };

export function LoginPage() {
  const { session, signIn, signOutReason } = useAuth();
  const location = useLocation();
  const id = useId();
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Once signed in, go to the page the customer originally asked for
  const from = (location.state as { from?: Location } | null)?.from;
  if (session) {
    return <Navigate to={from ? `${from.pathname}${from.search}` : '/'} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Check for missing details before sending anything
    const errors: FieldErrors = {};
    if (!username.trim()) errors.username = 'Enter your username.';
    if (!password) errors.password = 'Enter your password.';
    setFieldErrors(errors);
    setFormError(null);

    if (errors.username) return usernameRef.current?.focus();
    if (errors.password) return passwordRef.current?.focus();

    setSubmitting(true);
    try {
      await signIn({ username, password });
      // Success re-renders this page with a session, which redirects above
    } catch (error) {
      setFormError(getErrorMessage(error));
      setPassword(''); // never leave a rejected password sitting in the field
      passwordRef.current?.focus();
      setSubmitting(false);
    }
  };

  const fillDemoAccount = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setUsername(account.username);
    setPassword(account.password);
    setFieldErrors({});
    setFormError(null);
  };

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <div className={styles.card}>
          <span className={styles.logoTile}>
            <img className={styles.logo} src="/logo.svg" alt="Capitec" />
          </span>

          <div className={styles.heading}>
            <h1 className={styles.title}>Sign in</h1>
            <p className={styles.subtitle}>to see your spending insights</p>
          </div>

          {signOutReason && !formError && (
            <p className={styles.notice} role="status">
              {SIGN_OUT_MESSAGES[signOutReason]}
            </p>
          )}
          {formError && (
            <p className={styles.alert} role="alert">
              {formError}
            </p>
          )}

          <form className={styles.form} onSubmit={(event) => void handleSubmit(event)} noValidate>
            <div className={styles.field}>
              <label className={styles.label} htmlFor={`${id}-username`}>
                Username
              </label>
              <input
                ref={usernameRef}
                id={`${id}-username`}
                className={styles.input}
                type="text"
                name="username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                aria-invalid={fieldErrors.username ? true : undefined}
                aria-describedby={fieldErrors.username ? `${id}-username-error` : undefined}
              />
              {fieldErrors.username && (
                <p id={`${id}-username-error`} className={styles.fieldError}>
                  {fieldErrors.username}
                </p>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor={`${id}-password`}>
                Password
              </label>
              <div className={styles.passwordWrap}>
                <input
                  ref={passwordRef}
                  id={`${id}-password`}
                  className={styles.input}
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={fieldErrors.password ? true : undefined}
                  aria-describedby={fieldErrors.password ? `${id}-password-error` : undefined}
                />
                <button
                  type="button"
                  className={styles.toggle}
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-controls={`${id}-password`}
                >
                  {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p id={`${id}-password-error`} className={styles.fieldError}>
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <button type="submit" className={styles.submit} disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className={styles.security}>
            <ShieldCheck className={styles.securityIcon} aria-hidden="true" />
            We will never ask for your password by email, SMS or phone call.
          </p>
        </div>

        {showDemoAccounts && (
          <section className={styles.demo} aria-labelledby={`${id}-demo`}>
            <h2 id={`${id}-demo`} className={styles.demoTitle}>
              Demo accounts
            </h2>
            <p className={styles.demoNote}>This demo uses mocked data. Try either customer:</p>
            <ul className={styles.demoList}>
              {DEMO_ACCOUNTS.map((account) => (
                <li key={account.username} className={styles.demoItem}>
                  <span className={styles.demoDetails}>
                    <span className={styles.demoName}>{account.name}</span>
                    <span className={styles.demoCredentials}>
                      <code>{account.username}</code> / <code>{account.password}</code>
                    </span>
                  </span>
                  <button
                    type="button"
                    className={styles.useButton}
                    onClick={() => fillDemoAccount(account)}
                  >
                    Use<span className="visually-hidden">{` ${account.name}’s account`}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
