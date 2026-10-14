import type { Customer } from '../../api/schemas';
import { MDUDUZI_SPENDING, THANDI_SPENDING } from './merchants';
import type { SpendingProfile } from './merchants';

export type MockUser = {
  customer: Customer;
  username: string;
  /**
   * Demo only. A real backend never stores passwords: it stores a salted hash
   * (bcrypt or Argon2) and compares hashes, entirely on the server.
   */
  password: string;
  seed: number;
  spending: SpendingProfile;
};

export const MOCK_USERS: readonly MockUser[] = [
  {
    customer: {
      id: 'cust_001',
      firstName: 'Thandi',
      lastName: 'Mokoena',
      accountNumberMasked: '•••• 4821',
    },
    username: 'thandim',
    password: 'Thandi@2026',
    seed: 42,
    spending: THANDI_SPENDING,
  },
  {
    customer: {
      id: 'cust_002',
      firstName: 'Mduduzi',
      lastName: 'Mdluli',
      accountNumberMasked: '•••• 7310',
    },
    username: 'mdlulim',
    password: 'Mdu@2026',
    seed: 7,
    spending: MDUDUZI_SPENDING,
  },
];
