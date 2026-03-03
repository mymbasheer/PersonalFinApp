// mobile/src/hooks/useAsync.ts
// ─────────────────────────────────────────────────
// Generic hook for async operations with loading/error state.
// Use this in screens instead of manual loading/error state.
// ─────────────────────────────────────────────────

import { useState, useCallback, useRef, useEffect } from 'react';

interface AsyncState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

interface UseAsyncReturn<T> extends AsyncState<T> {
    execute: (...args: unknown[]) => Promise<void>;
    reset: () => void;
}

/**
 * Wraps an async function with loading, error, and data state.
 *
 * ```ts
 * const { data, loading, error, execute } = useAsync(txnAPI.list);
 * useEffect(() => { execute(); }, [execute]);
 * ```
 */
export function useAsync<T>(
    fn: (...args: unknown[]) => Promise<{ data: T }>,
    immediate = false,
): UseAsyncReturn<T> {
    const [state, setState] = useState<AsyncState<T>>({
        data: null, loading: immediate, error: null,
    });

    // Track if component is still mounted to avoid setState on unmounted
    const mounted = useRef(true);
    useEffect(() => () => { mounted.current = false; }, []);

    const execute = useCallback(async (...args: unknown[]) => {
        if (!mounted.current) return;
        setState(s => ({ ...s, loading: true, error: null }));
        try {
            const res = await fn(...args);
            if (mounted.current) setState({ data: res.data, loading: false, error: null });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Unknown error';
            if (mounted.current) setState(s => ({ ...s, loading: false, error: msg }));
        }
    }, [fn]);

    const reset = useCallback(() => {
        setState({ data: null, loading: false, error: null });
    }, []);

    // Auto-execute if immediate flag set
    useEffect(() => { if (immediate) execute(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return { ...state, execute, reset };
}
