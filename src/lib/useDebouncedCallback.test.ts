import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebouncedCallback } from './useDebouncedCallback';

describe('useDebouncedCallback', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('calls back once calls pause, with the latest arguments', () => {
        const callback = vi.fn();
        const { result } = renderHook(() => useDebouncedCallback(callback, 300));

        act(() => {
            result.current.run('a');
            result.current.run('ab');
        });

        vi.advanceTimersByTime(299);
        expect(callback).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(callback).toHaveBeenCalledOnce();
        expect(callback).toHaveBeenCalledWith('ab');
    });

    it('can be cancelled', () => {
        const callback = vi.fn();
        const { result } = renderHook(() => useDebouncedCallback(callback, 300));

        act(() => {
            result.current.run('a');
            result.current.cancel();
        });
        vi.advanceTimersByTime(300);

        expect(callback).not.toHaveBeenCalled();
    });

    it('drops pending calls when unmounted', () => {
        const callback = vi.fn();
        const { result, unmount } = renderHook(() => useDebouncedCallback(callback, 300));

        act(() => result.current.run('a'));
        unmount();
        vi.advanceTimersByTime(300);

        expect(callback).not.toHaveBeenCalled();
    });
});