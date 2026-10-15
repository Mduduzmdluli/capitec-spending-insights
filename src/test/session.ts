import type { Session } from '../api/schemas';
import { findCustomer } from '../mocks/db';
import { createSession } from '../mocks/sessions';

/** A real session on the mock server, as if the customer had signed in. */
export function createTestSession(customerId = 'cust_001'): Session {
  const customer = findCustomer(customerId);
  if (!customer) throw new Error(`No mock customer with ID ${customerId}`);

  const { token, expiresAt } = createSession(customerId);
  return { token, expiresAt: new Date(expiresAt).toISOString(), customer };
}
