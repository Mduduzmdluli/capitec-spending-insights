import { useCallback, useEffect, useRef, useState } from 'react';

/** Things that count as the customer still being there */
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'scroll', 'wheel', 'touchstart'] as const;

type Options = {
  /** Idle time before signing out */
  timeoutMs: number;
  /** How long before that to warn */
  warningMs: number;
  onTimeout: () => void;
};

/**
 * Tracks inactivity. Returns the seconds left while warning (null otherwise),
 * and `stayActive` to restart the clock.
 *
 * It compares timestamps rather than counting ticks, because browsers slow timers
 * down in background tabs, which would make a tick count drift.
 */
export function useInactivityTimeout({ timeoutMs, warningMs, onTimeout }: Options) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const lastActivity = useRef(Date.now());
  const warning = useRef(false);
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  });

  useEffect(() => {
    // Once the warning shows, only an explicit choice counts, not a stray mouse movement
    const markActive = () => {
      if (!warning.current) lastActivity.current = Date.now();
    };
    for (const name of ACTIVITY_EVENTS) {
      window.addEventListener(name, markActive, { passive: true });
    }

    const interval = setInterval(() => {
      const remaining = timeoutMs - (Date.now() - lastActivity.current);

      if (remaining <= 0) {
        clearInterval(interval);
        onTimeoutRef.current();
      } else if (remaining <= warningMs) {
        warning.current = true;
        setSecondsLeft(Math.ceil(remaining / 1000));
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      for (const name of ACTIVITY_EVENTS) {
        window.removeEventListener(name, markActive);
      }
    };
  }, [timeoutMs, warningMs]);

  const stayActive = useCallback(() => {
    lastActivity.current = Date.now();
    warning.current = false;
    setSecondsLeft(null);
  }, []);

  return { secondsLeft, stayActive };
}
