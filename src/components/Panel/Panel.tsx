import { useId } from 'react';
import type { ReactNode } from 'react';
import styles from './Panel.module.css';

type PanelProps = {
    title: string;
    description?: ReactNode;
    /** Shown beside the title on wide screens, below it on narrow ones */
    aside?: ReactNode;
    children: ReactNode;
    className?: string;
};

/** A titled section of the dashboard. The title labels the region for screen readers. */
export function Panel({ title, description, aside, children, className }: PanelProps) {
    const headingId = useId();

    return (
        <section
            className={[styles.panel, className].filter(Boolean).join(' ')}
            aria-labelledby={headingId}
        >
            <header className={styles.header}>
                <div className={styles.titles}>
                    <h2 id={headingId} className={styles.title}>
                        {title}
                    </h2>
                    {description && <p className={styles.description}>{description}</p>}
                </div>
                {aside}
            </header>
            {children}
        </section>
    );
}