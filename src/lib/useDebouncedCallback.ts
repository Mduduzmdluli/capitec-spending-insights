import { useCallback, useEffect, useRef } from 'react';

/**
 * Returns `run`, which calls `callback` only once calls have paused for `delay` ms,
 * with the latest arguments, and `cancel`, which drops any pending call.
 */
export function useDebouncedCallback<Args extends unknown[]>(
    callback: (...args: Args) => void,
    delay: number,
) {
    const callbackRef = useRef(callback);
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Always call the latest callback without restarting the timer
    useEffect(() => {
        callbackRef.current = callback;
    });

    const cancel = useCallback(() => clearTimeout(timerRef.current), []);

    const run = useCallback(
        (...args: Args) => {
            clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => callbackRef.current(...args), delay);
        },
        [delay],
    );

    // Never fire after the component has gone
    useEffect(() => cancel, [cancel]);

    return { run, cancel };
}