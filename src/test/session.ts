import type { Session } from '../api/schemas';
import { findUser } from '../mocks/db';
import { createSession } from '../mocks/sessions';

/** A real session on the mock server, as if the customer had signed in. */
export function createTestSession(customerId = 'cust_001'): Session {
  const user = findUser(customerId);
  if (!user) throw new Error(`No mock customer with ID ${customerId}`);

  const { token, expiresAt } = createSession(customerId);
  return {
    token,
    expiresAt: new Date(expiresAt).toISOString(),
    customer: { id: user.id, name: user.name },
  };
}
