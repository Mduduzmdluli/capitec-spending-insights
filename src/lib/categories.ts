import type { CategoryId } from '../api/schemas';

type CategoryMeta = {
  label: string;
};

/** Display names for each category. Typed as a Record so a new category can't be forgotten. */
export const CATEGORIES: Record<CategoryId, CategoryMeta> = {
  groceries: { label: 'Groceries' },
  dining: { label: 'Eating out' },
  transport: { label: 'Transport' },
  fuel: { label: 'Fuel' },
  shopping: { label: 'Shopping' },
  entertainment: { label: 'Entertainment' },
  utilities: { label: 'Utilities' },
  airtime_data: { label: 'Airtime & data' },
  health: { label: 'Health & fitness' },
  income: { label: 'Income' },
};
