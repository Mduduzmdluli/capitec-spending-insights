import { PERIODS } from '../../../lib/period';
import type { Period } from '../../../lib/period';
import styles from './PeriodSelector.module.css';

type PeriodSelectorProps = {
  value: Period;
  onChange: (period: Period) => void;
};

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <fieldset className={styles.selector}>
      <legend className="visually-hidden">Show spending for the last</legend>
      {PERIODS.map((period) => (
        <label key={period.id} className={styles.option}>
          <input
            className={styles.input}
            type="radio"
            name="period"
            value={period.id}
            checked={value === period.id}
            onChange={() => onChange(period.id)}
          />
          <span className={styles.label}>{period.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
