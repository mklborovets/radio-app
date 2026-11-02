import { createThrottle } from '../src/shared/lib/throttle';

describe('createThrottle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('runs the first call immediately and the latest trailing call after the interval', () => {
    const callback = jest.fn();
    const throttled = createThrottle(callback, 1000);

    throttled(1);
    throttled(2);
    throttled(3);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(1);

    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenLastCalledWith(3);
  });

  it('cancel drops the pending call', () => {
    const callback = jest.fn();
    const throttled = createThrottle(callback, 1000);

    throttled(1);
    throttled(2);
    throttled.cancel();
    jest.advanceTimersByTime(2000);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('flush runs immediately and clears the pending call', () => {
    const callback = jest.fn();
    const throttled = createThrottle(callback, 1000);

    throttled(1);
    throttled(2);
    throttled.flush(9);
    expect(callback).toHaveBeenLastCalledWith(9);
    jest.advanceTimersByTime(2000);
    expect(callback).toHaveBeenCalledTimes(2);
  });
});
