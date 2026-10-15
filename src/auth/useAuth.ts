import { useContext } from 'react';
import type { ApiAuth } from '../api/customerApi';
import { AuthContext } from './AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider');
  return context;
}

/** The signed-in customer's ID and token, for API requests. Only for protected pages. */
export function useApiAuth(): ApiAuth {
  const { session } = useAuth();
  if (!session) throw new Error('useApiAuth must be used on a page that requires sign-in');
  return { token: session.token, customerId: session.customer.id };
}
