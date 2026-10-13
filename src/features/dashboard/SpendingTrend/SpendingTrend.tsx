import { useId } from 'react';
import type { ReactNode } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getErrorMessage } from '../../../api/client';
import { useSpendingTrends } from '../../../api/hooks';
import type { DateRange, TrendInterval } from '../../../api/schemas';
import { ErrorState } from '../../../components/ErrorState/ErrorState';
import { Money } from '../../../components/Money';
import { Panel } from '../../../components/Panel/Panel';
import { Skeleton } from '../../../components/Skeleton/Skeleton';
import { formatCompactRand } from '../../../lib/formatCurrency';
import { getPeriodInterval } from '../../../lib/period';
import type { Period } from '../../../lib/period';
import styles from './SpendingTrend.module.css';
import { formatPeriodLong, formatTick, INTERVAL_TEXT, summariseTrend } from './trendFormat';
import type { TrendPoint } from './trendFormat';

const AXIS_TICK = { fill: 'var(--color-ink-muted)', fontSize: 12 };

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

type SpendingTrendProps = {
  period: Period;
  range: DateRange;
};

export function SpendingTrend({ period, range }: SpendingTrendProps) {
  const interval = getPeriodInterval(period);
  const { data, error, isPending, isError, isFetching, refetch } = useSpendingTrends(
    range,
    interval,
  );
  const { description, noun } = INTERVAL_TEXT[interval];

  let content: ReactNode;
  let aside: ReactNode = null;

  if (isPending) {
    content = <TrendSkeleton />;
  } else if (isError) {
    content = (
      <ErrorState
        title="We couldn’t load your spending over time"
        message={getErrorMessage(error)}
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  } else {
    const { average, peak } = summariseTrend(data.points);

    if (!peak) {
      content = <p className={styles.empty}>No spending in this period.</p>;
    } else {
      aside = (
        <dl className={styles.stats}>
          <div className={styles.stat}>
            <dt>{`Average per ${noun}`}</dt>
            <dd>
              <Money cents={average} />
            </dd>
          </div>
          <div className={styles.stat}>
            <dt>{`Highest ${noun}`}</dt>
            <dd>
              <Money cents={peak.totalCents} />
              <span className={styles.statDate}>
                {formatPeriodLong(peak.periodStart, interval)}
              </span>
            </dd>
          </div>
        </dl>
      );
      content = (
        <>
          <TrendChart points={data.points} interval={interval} average={average} />
          <TrendTable points={data.points} interval={interval} />
        </>
      );
    }
  }

  return (
    <Panel
      className={styles.panel}
      title="Spending over time"
      description={description}
      aside={aside}
    >
      {content}
    </Panel>
  );
}

type ChartProps = {
  points: TrendPoint[];
  interval: TrendInterval;
  average: number;
};

/** Visual only: screen readers get the same data from TrendTable. */
function TrendChart({ points, interval, average }: ChartProps) {
  // useId can contain characters that break url(#...) references, so keep it alphanumeric
  const gradientId = `trend-fill-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <div className={styles.chart} aria-hidden="true">
      <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={{ width: 640, height: 260 }}
      >
        <AreaChart
          data={points}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          accessibilityLayer={false}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="periodStart"
            tickFormatter={(value: string) => formatTick(value, interval)}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={24}
          />
          <YAxis
            tickFormatter={(value: number) => formatCompactRand(value)}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={64}
          />
          <Tooltip
            cursor={{ stroke: 'var(--color-border)', strokeWidth: 1 }}
            content={({ active, payload }) =>
              active && payload && payload.length > 0 ? (
                <TrendTooltip point={payload[0].payload as TrendPoint} interval={interval} />
              ) : null
            }
          />
          <ReferenceLine
            y={average}
            stroke="var(--color-ink-muted)"
            strokeDasharray="4 4"
            ifOverflow="extendDomain"
          />
          <Area
            type="monotone"
            dataKey="totalCents"
            stroke="var(--color-accent)"
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            activeDot={{ r: 4, strokeWidth: 0, fill: 'var(--color-accent)' }}
            isAnimationActive={!prefersReducedMotion()}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function TrendTooltip({ point, interval }: { point: TrendPoint; interval: TrendInterval }) {
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{formatPeriodLong(point.periodStart, interval)}</p>
      <p className={styles.tooltipValue}>
        <Money cents={point.totalCents} />
      </p>
    </div>
  );
}

function TrendTable({ points, interval }: { points: TrendPoint[]; interval: TrendInterval }) {
  const { noun } = INTERVAL_TEXT[interval];

  return (
    <table className="visually-hidden">
      <caption>{`Spending per ${noun}`}</caption>
      <thead>
        <tr>
          <th scope="col">Period</th>
          <th scope="col">Amount spent</th>
        </tr>
      </thead>
      <tbody>
        {points.map((point) => (
          <tr key={point.periodStart}>
            <th scope="row">{formatPeriodLong(point.periodStart, interval)}</th>
            <td>
              <Money cents={point.totalCents} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TrendSkeleton() {
  return (
    <div className={styles.loading}>
      <p role="status" className="visually-hidden">
        Loading spending over time
      </p>
      <Skeleton height="100%" className={styles.chartSkeleton} />
    </div>
  );
}
