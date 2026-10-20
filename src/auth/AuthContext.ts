import { createContext } from 'react';
import type { LoginRequest, Session } from '../api/schemas';

export type SignOutReason = 'signed-out' | 'expired' | 'inactive';

export type AuthContextValue = {
  session: Session | null;
  /** Why the customer was last signed out, so the sign-in page can explain it */
  signOutReason: SignOutReason | null;
  signIn: (credentials: LoginRequest) => Promise<void>;
  signOut: (reason?: SignOutReason) => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
