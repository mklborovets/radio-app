import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import TrackPlayer from 'react-native-track-player';
import { usePlayerStore } from '@entities/player';
import { formatTime } from '@shared/lib/formatTime';
import { COLORS } from '@shared/ui';

export type SleepTimerPresetMinutes = 15 | 30 | 45 | 60;

export const SLEEP_TIMER_PRESETS: readonly SleepTimerPresetMinutes[] = [15, 30, 45, 60];

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

export function SleepTimerControl(): React.JSX.Element {
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

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Sleep Timer</Text>
        {sleepTimerTargetTimestamp !== null && remainingSeconds > 0 && (
          <Text style={styles.countdown}>{formatTime(remainingSeconds)}</Text>
        )}
      </View>

      <View style={styles.presetsRow}>
        {SLEEP_TIMER_PRESETS.map((minutes) => (
          <TouchableOpacity
            key={minutes}
            style={styles.presetButton}
            onPress={() => scheduleSleepTimer(minutes)}>
            <Text style={styles.presetText}>{minutes}m</Text>
          </TouchableOpacity>
        ))}

        {sleepTimerTargetTimestamp !== null && (
          <TouchableOpacity
            style={[styles.presetButton, styles.cancelButton]}
            onPress={() => scheduleSleepTimer(null)}>
            <Text style={styles.cancelText}>OFF</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 24,
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  countdown: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceElevated,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cancelButton: {
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
  },
  cancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
});
