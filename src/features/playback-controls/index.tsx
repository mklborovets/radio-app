import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  changePlaybackSpeed,
  PLAYBACK_SPEED_OPTIONS,
  seekRelativeSeconds,
  skipToNextInQueue,
  skipToPreviousInQueue,
  togglePlaybackState,
  usePlayerStore,
} from '@entities/player';
import { COLORS } from '@shared/ui';

export interface PlaybackControlsPanelProps {
  isRadioStream: boolean;
}

export function PlaybackControlsPanel({
  isRadioStream,
}: PlaybackControlsPanelProps): React.JSX.Element {
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isBuffering = usePlayerStore((state) => state.isBuffering);
  const playbackSpeed = usePlayerStore((state) => state.playbackSpeed);
  const queueLength = usePlayerStore((state) => state.queue.length);

  return (
    <View style={styles.container}>
      <View style={styles.mainTransport}>
        {!isRadioStream && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              seekRelativeSeconds(-30).catch(() => {});
            }}>
            <Text style={styles.secondaryButtonText}>-30s</Text>
          </TouchableOpacity>
        )}

        {queueLength > 1 && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              skipToPreviousInQueue().catch(() => {});
            }}>
            <Text style={styles.secondaryButtonText}>PREV</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            togglePlaybackState().catch(() => {});
          }}>
          <Text style={styles.primaryButtonText}>
            {isBuffering ? 'BUFFERING' : isPlaying ? 'PAUSE' : 'PLAY'}
          </Text>
        </TouchableOpacity>

        {queueLength > 1 && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              skipToNextInQueue().catch(() => {});
            }}>
            <Text style={styles.secondaryButtonText}>NEXT</Text>
          </TouchableOpacity>
        )}

        {!isRadioStream && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              seekRelativeSeconds(30).catch(() => {});
            }}>
            <Text style={styles.secondaryButtonText}>+30s</Text>
          </TouchableOpacity>
        )}
      </View>

      {!isRadioStream && (
        <View style={styles.speedSection}>
          <Text style={styles.sectionLabel}>Playback Speed</Text>
          <View style={styles.speedRow}>
            {PLAYBACK_SPEED_OPTIONS.map((speed) => {
              const isSelected = playbackSpeed === speed;
              return (
                <TouchableOpacity
                  key={speed}
                  style={[styles.speedChip, isSelected && styles.speedChipActive]}
                  onPress={() => {
                    changePlaybackSpeed(speed).catch(() => {});
                  }}>
                  <Text
                    style={[
                      styles.speedChipText,
                      isSelected && styles.speedChipTextActive,
                    ]}>
                    {speed}x
                  </Text>
                </TouchableOpacity>
              );
            })}
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
    gap: 10,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
    minWidth: 120,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.background,
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
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
