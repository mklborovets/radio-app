import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, PlayPauseButton } from '@shared/ui';
import { usePlaybackControls } from './model';

export interface PlaybackControlsPanelProps {
  isRadioStream: boolean;
}

export function PlaybackControlsPanel({
  isRadioStream,
}: PlaybackControlsPanelProps): React.JSX.Element {
  const {
    hasMultipleTracks,
    isPlaying,
    isBuffering,
    speedChips,
    onRewind,
    onForward,
    onPrevious,
    onNext,
    onTogglePlay,
    onSelectSpeed,
  } = usePlaybackControls();

  return (
    <View style={styles.container}>
      <View style={styles.mainTransport}>
        {hasMultipleTracks && (
          <TouchableOpacity
            style={styles.navButton}
            onPress={onPrevious}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.navIcon}>◀◀</Text>
          </TouchableOpacity>
        )}

        <PlayPauseButton
          isPlaying={isPlaying}
          isLoading={isBuffering}
          size="large"
          variant="primary"
          onPress={onTogglePlay}
        />

        {hasMultipleTracks && (
          <TouchableOpacity
            style={styles.navButton}
            onPress={onNext}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.navIcon}>▶▶</Text>
          </TouchableOpacity>
        )}
      </View>

      {!isRadioStream && (
        <View style={styles.seekRow}>
          <TouchableOpacity
            style={styles.seekButton}
            onPress={onRewind}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.seekButtonText}>-30s</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.seekButton}
            onPress={onForward}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.seekButtonText}>+30s</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isRadioStream && (
        <View style={styles.speedSection}>
          <Text style={styles.sectionLabel}>Playback Speed</Text>
          <View style={styles.speedRow}>
            {speedChips.map((chip) => (
              <TouchableOpacity
                key={chip.speed}
                style={[styles.speedChip, chip.isSelected && styles.speedChipActive]}
                onPress={() => onSelectSpeed(chip.speed)}>
                <Text
                  style={[
                    styles.speedChipText,
                    chip.isSelected && styles.speedChipTextActive,
                  ]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 20,
  },
  mainTransport: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  navButton: {
    backgroundColor: COLORS.surface,
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  seekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  seekButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  seekButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  speedSection: {
    marginTop: 18,
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  speedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  speedChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  speedChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  speedChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  speedChipTextActive: {
    color: COLORS.background,
  },
});
