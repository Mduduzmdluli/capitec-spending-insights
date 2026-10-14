import type { CategoryId } from '../../api/schemas';

/** Everyday card spending. Amounts are illustrative. */
export type DiscretionaryProfile = {
  category: CategoryId;
  merchants: readonly string[];
  perWeek: number;
  weekendMultiplier: number;
  minRand: number;
  maxRand: number;
};

export type RecurringPayment = {
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

/** Everything that shapes one customer's transactions. */
export type SpendingProfile = {
  discretionary: readonly DiscretionaryProfile[];
  recurring: readonly RecurringPayment[];
  salary: { merchant: string; amountCents: number; dayOfMonth: number };
};

/** An established professional: medical aid, a car, a gym contract. */
export const THANDI_SPENDING: SpendingProfile = {
  discretionary: DISCRETIONARY_PROFILES,
  recurring: RECURRING_PAYMENTS,
  salary: SALARY,
};

/** A young professional: no car, more takeaways and taxis, a smaller salary. */
export const MDUDUZI_SPENDING: SpendingProfile = {
  discretionary: [
    {
      category: 'groceries',
      merchants: ['Shoprite', 'Checkers', 'Boxer'],
      perWeek: 2,
      weekendMultiplier: 1.3,
      minRand: 60,
      maxRand: 900,
    },
    {
      category: 'dining',
      merchants: ['KFC', 'Steers', 'Debonairs Pizza', 'Chicken Licken'],
      perWeek: 3,
      weekendMultiplier: 1.8,
      minRand: 45,
      maxRand: 280,
    },
    {
      category: 'transport',
      merchants: ['Uber', 'Bolt', 'Rea Vaya', 'Gautrain'],
      perWeek: 4,
      weekendMultiplier: 0.7,
      minRand: 20,
      maxRand: 180,
    },
    {
      category: 'shopping',
      merchants: ['Takealot', 'Mr Price', 'Pep', 'Sportscene'],
      perWeek: 0.8,
      weekendMultiplier: 1.7,
      minRand: 100,
      maxRand: 1500,
    },
    {
      category: 'entertainment',
      merchants: ['Steam', 'PlayStation Store', 'Ster-Kinekor'],
      perWeek: 0.8,
      weekendMultiplier: 2,
      minRand: 80,
      maxRand: 700,
    },
    {
      category: 'airtime_data',
      merchants: ['MTN', 'Vodacom', 'Telkom'],
      perWeek: 1.5,
      weekendMultiplier: 1,
      minRand: 29,
      maxRand: 299,
    },
    {
      category: 'utilities',
      merchants: ['City Power Prepaid'],
      perWeek: 0.3,
      weekendMultiplier: 1,
      minRand: 150,
      maxRand: 500,
    },
  ],
  recurring: [
    { merchant: 'Planet Fitness', category: 'health', amountCents: 39900, dayOfMonth: 1 },
    { merchant: 'Showmax', category: 'entertainment', amountCents: 9900, dayOfMonth: 2 },
    { merchant: 'Spotify', category: 'entertainment', amountCents: 6999, dayOfMonth: 8 },
    { merchant: 'MTN Contract', category: 'airtime_data', amountCents: 39900, dayOfMonth: 20 },
  ],
  salary: { merchant: 'Salary: Bright Labs (Pty) Ltd', amountCents: 1850000, dayOfMonth: 25 },
};
