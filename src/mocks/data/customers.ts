import { MDUDUZI_SPENDING, THANDI_SPENDING } from './merchants';
import type { SpendingProfile } from './merchants';
import type { GoalDefinition } from './aggregations';

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
  /** Monthly budgets the customer has set */
  goals: readonly GoalDefinition[];
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
    goals: [
      { id: 'goal_001', category: 'groceries', monthlyBudgetCents: 500000 },
      { id: 'goal_002', category: 'dining', monthlyBudgetCents: 200000 },
      { id: 'goal_003', category: 'shopping', monthlyBudgetCents: 250000 },
      { id: 'goal_004', category: 'entertainment', monthlyBudgetCents: 150000 },
    ],
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
    goals: [
      { id: 'goal_101', category: 'dining', monthlyBudgetCents: 180000 },
      { id: 'goal_102', category: 'transport', monthlyBudgetCents: 150000 },
      { id: 'goal_103', category: 'entertainment', monthlyBudgetCents: 90000 },
    ],
  },
];
