import styles from './Skeleton.module.css';

type SkeletonProps = {
  width?: string;
  height?: string;
  className?: string;
};

/** A placeholder block shown while content loads. Hidden from screen readers. */
export function Skeleton({ width = '100%', height = '1rem', className }: SkeletonProps) {
  return (
    <span
      className={[styles.skeleton, className].filter(Boolean).join(' ')}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}
