import { formatCurrency } from '../lib/formatCurrency';

type MoneyProps = {
  cents: number;
  className?: string;
};

export function Money({ cents, className }: MoneyProps) {
  return <span className={className}>{formatCurrency(cents)}</span>;
}
