import { PERIODS } from '../../../lib/period';
import type { Period } from '../../../lib/period';
import styles from './PeriodSelector.module.css';

type PeriodSelectorProps = {
  value: Period;
  onChange: (period: Period) => void;
  /** The periods the server offers. Until it has said, every period is shown. */
  available?: readonly Period[];
};

export function PeriodSelector({ value, onChange, available }: PeriodSelectorProps) {
  const options =
    available && available.length > 0
      ? PERIODS.filter((period) => available.includes(period.id) || period.id === value)
      : PERIODS;

  return (
    <fieldset className={styles.selector}>
      <legend className="visually-hidden">Show spending for the last</legend>
      {options.map((period) => (
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
