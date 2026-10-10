import {
  CarTaxiFront,
  Clapperboard,
  Fuel,
  HeartPulse,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  UtensilsCrossed,
  Wallet,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CategoryId } from '../api/schemas';

type CategoryMeta = {
  label: string;
  icon: LucideIcon;
  /** A CSS colour, defined in styles/categories.css with a dark-mode variant */
  color: string;
};

/** Display details for each category. Typed as a Record so a new category can't be forgotten. */
export const CATEGORIES: Record<CategoryId, CategoryMeta> = {
  groceries: { label: 'Groceries', icon: ShoppingCart, color: 'var(--category-groceries)' },
  dining: { label: 'Eating out', icon: UtensilsCrossed, color: 'var(--category-dining)' },
  transport: { label: 'Transport', icon: CarTaxiFront, color: 'var(--category-transport)' },
  fuel: { label: 'Fuel', icon: Fuel, color: 'var(--category-fuel)' },
  shopping: { label: 'Shopping', icon: ShoppingBag, color: 'var(--category-shopping)' },
  entertainment: {
    label: 'Entertainment',
    icon: Clapperboard,
    color: 'var(--category-entertainment)',
  },
  utilities: { label: 'Utilities', icon: Zap, color: 'var(--category-utilities)' },
  airtime_data: {
    label: 'Airtime & data',
    icon: Smartphone,
    color: 'var(--category-airtime-data)',
  },
  health: { label: 'Health & fitness', icon: HeartPulse, color: 'var(--category-health)' },
  income: { label: 'Income', icon: Wallet, color: 'var(--category-income)' },
};
