import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '@shared/ui';
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

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onTogglePlay}
          activeOpacity={0.85}>
          {isBuffering ? (
            <ActivityIndicator size="small" color={COLORS.background} />
          ) : isPlaying ? (
            <View style={styles.pauseIconContainer}>
              <View style={styles.pauseBar} />
              <View style={styles.pauseBar} />
            </View>
          ) : (
            <Text style={[styles.primaryIcon, styles.playIconOffset]}>▶</Text>
          )}
        </TouchableOpacity>

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
  primaryButton: {
    backgroundColor: COLORS.primary,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryIcon: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.background,
  },
  pauseIconContainer: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseBar: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: COLORS.background,
  },
  playIconOffset: {
    marginLeft: 3,
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
    marginTop: 14,
  },
  seekButton: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  seekButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  speedSection: {
    marginTop: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  speedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  speedChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  speedChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  speedChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  speedChipTextActive: {
    color: COLORS.background,
  },
});

