import type { CategoryId } from '../../api/schemas';

/** The colour and icon name the API sends with each category, as in the API document. */
export const CATEGORY_STYLES: Record<CategoryId, { color: string; icon: string }> = {
  groceries: { color: '#FF6B6B', icon: 'shopping-cart' },
  entertainment: { color: '#4ECDC4', icon: 'film' },
  transport: { color: '#45B7D1', icon: 'car' },
  dining: { color: '#F7DC6F', icon: 'utensils' },
  shopping: { color: '#BB8FCE', icon: 'shopping-bag' },
  utilities: { color: '#85C1E9', icon: 'zap' },
  fuel: { color: '#F0B27A', icon: 'fuel' },
  airtime_data: { color: '#AAB7B8', icon: 'smartphone' },
  health: { color: '#82E0AA', icon: 'heart-pulse' },
  income: { color: '#58D68D', icon: 'wallet' },
};
