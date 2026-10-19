import { MDUDUZI_SPENDING, THANDI_SPENDING } from './merchants';
import type { SpendingProfile } from './merchants';

/** A customer as the mock server stores them: their profile, sign-in details and spending. */
export type MockUser = {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  accountType: string;
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
    id: 'cust_001',
    name: 'Thandi Mokoena',
    email: 'thandi.mokoena@gmail.com',
    joinDate: '2021-03-14',
    accountType: 'premium',
    username: 'thandi',
    password: 'Thandi@2026',
    seed: 42,
    spending: THANDI_SPENDING,
  },
  {
    id: 'cust_002',
    name: 'Mduduzi Mdluli',
    email: 'mduduzmdluli@gmail.com',
    joinDate: '2024-06-02',
    accountType: 'standard',
    username: 'mdlulim',
    password: 'Mdu@2026',
    seed: 7,
    spending: MDUDUZI_SPENDING,
  },
];
