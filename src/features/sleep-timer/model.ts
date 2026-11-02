import { useCallback, useEffect, useState } from 'react';
import TrackPlayer from 'react-native-track-player';
import { usePlayerStore } from '@entities/player';
import { formatTime } from '@shared/lib/formatTime';

export type SleepTimerPresetMinutes = 1 | 5 | 10 | 25;

export const SLEEP_TIMER_PRESETS: readonly SleepTimerPresetMinutes[] = [1, 5, 10, 25];

let activeTimeoutId: ReturnType<typeof setTimeout> | null = null;

export function scheduleSleepTimer(minutes: SleepTimerPresetMinutes | null): void {
  if (activeTimeoutId !== null) {
    clearTimeout(activeTimeoutId);
    activeTimeoutId = null;
  }

  const store = usePlayerStore.getState();

  if (minutes === null) {
    store.setSleepTimerTargetTimestamp(null);
    return;
  }

  const durationMs = minutes * 60 * 1000;
  const targetTimestamp = Date.now() + durationMs;
  store.setSleepTimerTargetTimestamp(targetTimestamp);

  activeTimeoutId = setTimeout(() => {
    activeTimeoutId = null;
    TrackPlayer.pause()
      .then(() => {
        const latestStore = usePlayerStore.getState();
        latestStore.setIsPlaying(false);
        latestStore.setSleepTimerTargetTimestamp(null);
      })
      .catch(() => {});
  }, durationMs);
}

export interface UseSleepTimerResult {
  isActive: boolean;
  formattedRemaining: string | null;
  presets: readonly SleepTimerPresetMinutes[];
  onSelectPreset: (minutes: SleepTimerPresetMinutes) => void;
  onCancelTimer: () => void;
}

export function useSleepTimer(): UseSleepTimerResult {
  const sleepTimerTargetTimestamp = usePlayerStore(
    (state) => state.sleepTimerTargetTimestamp,
  );
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  useEffect(() => {
    if (!sleepTimerTargetTimestamp) {
      setRemainingSeconds(0);
      return;
    }

    const updateRemaining = (): void => {
      const diffSeconds = Math.max(
        0,
        Math.ceil((sleepTimerTargetTimestamp - Date.now()) / 1000),
      );
      setRemainingSeconds(diffSeconds);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [sleepTimerTargetTimestamp]);

  const onSelectPreset = useCallback((minutes: SleepTimerPresetMinutes) => {
    scheduleSleepTimer(minutes);
  }, []);

  const onCancelTimer = useCallback(() => {
    scheduleSleepTimer(null);
  }, []);

  const isActive = sleepTimerTargetTimestamp !== null;
  const formattedRemaining =
    isActive && remainingSeconds > 0 ? formatTime(remainingSeconds) : null;

  return {
    isActive,
    formattedRemaining,
    presets: SLEEP_TIMER_PRESETS,
    onSelectPreset,
    onCancelTimer,
  };
}
