import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '@shared/ui';
import { useSleepTimer } from './model';

export function SleepTimerControl(): React.JSX.Element {
  const {
    isActive,
    formattedRemaining,
    presets,
    onSelectPreset,
    onCancelTimer,
  } = useSleepTimer();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Sleep Timer</Text>
        {formattedRemaining && (
          <Text style={styles.countdown}>Stops in {formattedRemaining}</Text>
        )}
      </View>

      <View style={styles.presetsRow}>
        {presets.map((minutes) => (
          <TouchableOpacity
            key={minutes}
            style={styles.presetButton}
            onPress={() => onSelectPreset(minutes)}>
            <Text style={styles.presetText}>{minutes}m</Text>
          </TouchableOpacity>
        ))}

        {isActive && (
          <TouchableOpacity
            style={[styles.presetButton, styles.cancelButton]}
            onPress={onCancelTimer}>
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
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  presetButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cancelButton: {
    backgroundColor: 'rgba(244, 63, 94, 0.16)',
    borderColor: 'rgba(244, 63, 94, 0.4)',
  },
  cancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
});

