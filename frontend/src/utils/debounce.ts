/**
 * Creates a debounced version of a function that delays invoking until after
 * the specified wait time has elapsed since the last time it was invoked.
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };
}

/**
 * Creates a throttled version of a function that only invokes at most once
 * per every wait milliseconds.
 */
export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>) {
    const now = Date.now();

    if (now - lastTime >= wait) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastTime = now;
      func(...args);
    } else if (!timeoutId) {
      // Schedule trailing call
      timeoutId = setTimeout(
        () => {
          lastTime = Date.now();
          timeoutId = null;
          func(...args);
        },
        wait - (now - lastTime),
      );
    }
  };
}

/**
 * Hook-friendly debounce that returns a stable function reference.
 * Use with useCallback and useMemo for best results.
 */
export function useDebouncedCallback<
  T extends (...args: Parameters<T>) => ReturnType<T>,
>(
  callback: T,
  wait: number,
  deps: React.DependencyList,
): (...args: Parameters<T>) => void {
  const timeoutRef = { current: null as ReturnType<typeof setTimeout> | null };
  const callbackRef = { current: callback };

  // Keep callback ref updated
  callbackRef.current = callback;

  return function (...args: Parameters<T>) {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
      timeoutRef.current = null;
    }, wait);
  };
}
