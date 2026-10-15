import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../api/authApi';
import { ApiError } from '../api/client';
import type { LoginRequest, Session } from '../api/schemas';
import { AuthContext } from './AuthContext';
import type { SignOutReason } from './AuthContext';
import { clearStoredSession, loadStoredSession, storeSession } from './storedSession';

type AuthProviderProps = {
  children: ReactNode;
  /** For tests: start with this session instead of reading storage */
  initialSession?: Session | null;
};

export function AuthProvider({ children, initialSession }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(() =>
    initialSession !== undefined ? initialSession : loadStoredSession(),
  );
  const [signOutReason, setSignOutReason] = useState<SignOutReason | null>(null);

  const signIn = useCallback(async (credentials: LoginRequest) => {
    const next = await authApi.login(credentials); // throws ApiError if refused
    storeSession(next);
    setSignOutReason(null);
    setSession(next);
  }, []);

  const signOut = useCallback(
    (reason: SignOutReason = 'signed-out') => {
      if (!session) return;
      // End the session on the server too; the customer is signed out here either way
      void authApi.logout(session.token).catch(() => undefined);
      clearStoredSession();
      setSession(null);
      setSignOutReason(reason);
    },
    [session],
  );

  // Safeguard 1: once signed out, forget every cached response,
  // so the next person on this device can't see the previous customer's data
  useEffect(() => {
    if (!session) queryClient.clear();
  }, [session, queryClient]);

  // Safeguard 2: the server decides when a session ends. Any 401 response
  // means it has, so sign out and explain why
  useEffect(
    () =>
      queryClient.getQueryCache().subscribe((event) => {
        if (
          event.type === 'updated' &&
          event.action.type === 'error' &&
          event.action.error instanceof ApiError &&
          event.action.error.status === 401
        ) {
          signOut('expired');
        }
      }),
    [queryClient, signOut],
  );

  const value = useMemo(
    () => ({ session, signOutReason, signIn, signOut }),
    [session, signOutReason, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
