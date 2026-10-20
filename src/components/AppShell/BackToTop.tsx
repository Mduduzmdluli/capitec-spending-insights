import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import styles from './BackToTop.module.css';

/** How far down the page before the button appears */
const SHOW_AFTER_PX = 600;

type BackToTopProps = {
  /** The element that receives focus afterwards, so keyboard users continue from the top */
  targetId: string;
};

export function BackToTop({ targetId }: BackToTopProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    update();
    // passive: the listener never blocks scrolling, which keeps it smooth on phones
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  if (!visible) return null;

  const handleClick = () => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    document.getElementById(targetId)?.focus({ preventScroll: true });
  };

  return (
    <button type="button" className={styles.button} onClick={handleClick}>
      <ArrowUp className={styles.icon} aria-hidden="true" />
      <span className={styles.label}>Back to top</span>
    </button>
  );
}
