import type { CategoryId } from '../../api/schemas';

/** Everyday card spending. Amounts are illustrative. */
type DiscretionaryProfile = {
  category: CategoryId;
  merchants: readonly string[];
  perWeek: number;
  weekendMultiplier: number;
  minRand: number;
  maxRand: number;
};

type RecurringPayment = {
  merchant: string;
  category: CategoryId;
  amountCents: number;
  dayOfMonth: number;
};

export const DISCRETIONARY_PROFILES: readonly DiscretionaryProfile[] = [
  {
    category: 'groceries',
    merchants: ['Checkers', 'Pick n Pay', 'Woolworths Food', 'Shoprite', 'Spar'],
    perWeek: 2.5,
    weekendMultiplier: 1.4,
    minRand: 85,
    maxRand: 1800,
  },
  {
    category: 'dining',
    merchants: ["Nando's", 'Steers', 'KFC', 'Mugg & Bean', 'Uber Eats', 'Mr D Food'],
    perWeek: 2,
    weekendMultiplier: 1.8,
    minRand: 75,
    maxRand: 650,
  },
  {
    category: 'transport',
    merchants: ['Uber', 'Bolt', 'Gautrain'],
    perWeek: 2,
    weekendMultiplier: 0.8,
    minRand: 45,
    maxRand: 320,
  },
  {
    category: 'fuel',
    merchants: ['Engen', 'Shell', 'Sasol', 'BP', 'TotalEnergies'],
    perWeek: 0.9,
    weekendMultiplier: 1,
    minRand: 450,
    maxRand: 1200,
  },
  {
    category: 'shopping',
    merchants: ['Takealot', 'Mr Price', 'Woolworths', 'Clicks', 'Game'],
    perWeek: 1,
    weekendMultiplier: 1.6,
    minRand: 120,
    maxRand: 2500,
  },
  {
    category: 'entertainment',
    merchants: ['Ster-Kinekor', 'Computicket', 'Steam'],
    perWeek: 0.4,
    weekendMultiplier: 2,
    minRand: 150,
    maxRand: 600,
  },
  {
    category: 'utilities',
    merchants: ['City Power Prepaid', 'City of Johannesburg'],
    perWeek: 0.5,
    weekendMultiplier: 1,
    minRand: 200,
    maxRand: 900,
  },
  {
    category: 'airtime_data',
    merchants: ['Vodacom', 'MTN', 'Telkom'],
    perWeek: 1,
    weekendMultiplier: 1,
    minRand: 29,
    maxRand: 399,
  },
  {
    category: 'health',
    merchants: ['Dis-Chem', 'Clicks Pharmacy'],
    perWeek: 0.5,
    weekendMultiplier: 1,
    minRand: 60,
    maxRand: 750,
  },
];

export const RECURRING_PAYMENTS: readonly RecurringPayment[] = [
  { merchant: 'Discovery Health', category: 'health', amountCents: 285000, dayOfMonth: 1 },
  { merchant: 'DStv', category: 'entertainment', amountCents: 54900, dayOfMonth: 1 },
  { merchant: 'Virgin Active', category: 'health', amountCents: 75900, dayOfMonth: 3 },
  { merchant: 'Netflix', category: 'entertainment', amountCents: 19900, dayOfMonth: 5 },
  { merchant: 'Spotify', category: 'entertainment', amountCents: 6999, dayOfMonth: 12 },
  { merchant: 'Vodacom Contract', category: 'airtime_data', amountCents: 49900, dayOfMonth: 25 },
];

export const SALARY = { merchant: 'Salary: Acme (Pty) Ltd', amountCents: 3250000, dayOfMonth: 25 };
