import { MOCK_USERS } from '../mocks/data/customers';

/** A demo customer's sign-in details, read from the same data the mock server uses. */
function credentialsFor(customerId: string) {
  const user = MOCK_USERS.find((candidate) => candidate.customer.id === customerId);
  if (!user) throw new Error(`No mock customer with ID ${customerId}`);
  return { username: user.username, password: user.password };
}

export const THANDI = credentialsFor('cust_001');
export const MDUDUZI = credentialsFor('cust_002');
