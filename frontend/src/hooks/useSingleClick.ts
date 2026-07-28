import { useCallback, useRef } from 'react';

// Debounces a click so that a real double-click within `delay` ms cancels the
// pending single-click. Used to prevent single-click side effects (like expand
// / collapse) from firing when the user is actually double-clicking to rename.
export function useSingleClick(handler: () => void, delay = 120): (e?: unknown) => void {
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const clickCount = useRef(0);

    // Whenever the DOM's own `dblclick` event fires, cancel the pending single-click.
    // Callers should also invoke `cancel()` on their double-click handler.
    return useCallback(() => {
        clickCount.current += 1;
        if (timer.current) {
            clearTimeout(timer.current);
            timer.current = null;
        }
        // If this is already the 2nd click, do nothing — the dblclick handler wins.
        if (clickCount.current >= 2) {
            clickCount.current = 0;
            return;
        }
        timer.current = setTimeout(() => {
            timer.current = null;
            clickCount.current = 0;
            handler();
        }, delay);
    }, [handler, delay]);
}
