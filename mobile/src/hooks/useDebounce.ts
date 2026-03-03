// mobile/src/hooks/useDebounce.ts
// ─────────────────────────────────────────────────
// Debounces a value update by a given delay (ms).
// Useful for search inputs and live calculations.
// ─────────────────────────────────────────────────

import { useState, useEffect } from 'react';

/**
 * Returns a debounced version of `value` that only updates
 * after the specified `delay` has elapsed without new changes.
 *
 * ```ts
 * const debouncedQuery = useDebounce(searchText, 400);
 * useEffect(() => { search(debouncedQuery); }, [debouncedQuery]);
 * ```
 */
export function useDebounce<T>(value: T, delay = 400): T {
    const [debounced, setDebounced] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debounced;
}
