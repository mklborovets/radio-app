export interface ThrottledFunction<TArgs extends unknown[]> {
  (...args: TArgs): void;
  flush: (...args: TArgs) => void;
  cancel: () => void;
}

export function createThrottle<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  intervalMs: number,
): ThrottledFunction<TArgs> {
  let lastExecutedAt = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: TArgs | null = null;

  const clearScheduled = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const throttled = (...args: TArgs): void => {
    const now = Date.now();
    const remaining = intervalMs - (now - lastExecutedAt);

    if (remaining <= 0) {
      clearScheduled();
      pendingArgs = null;
      lastExecutedAt = now;
      callback(...args);
    } else {
      pendingArgs = args;
      if (timeoutId === null) {
        timeoutId = setTimeout(() => {
          timeoutId = null;
          if (pendingArgs !== null) {
            const argsToRun = pendingArgs;
            pendingArgs = null;
            lastExecutedAt = Date.now();
            callback(...argsToRun);
          }
        }, remaining);
      }
    }
  };

  throttled.flush = (...args: TArgs): void => {
    clearScheduled();
    pendingArgs = null;
    lastExecutedAt = Date.now();
    callback(...args);
  };

  throttled.cancel = (): void => {
    clearScheduled();
    pendingArgs = null;
  };

  return throttled;
}

