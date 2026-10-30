import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  seekRelativeSeconds,
  togglePlaybackState,
  usePlayerStore,
} from '@entities/player';
import { formatTime } from '@shared/lib/formatTime';
import { COLORS } from '@shared/ui';

export interface MiniPlayerProps {
  onOpenFullPlayer: () => void;
}

export function MiniPlayer({
  onOpenFullPlayer,
}: MiniPlayerProps): React.JSX.Element | null {
  const activeTrack = usePlayerStore((state) => state.activeTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isBuffering = usePlayerStore((state) => state.isBuffering);
  const positionSeconds = usePlayerStore((state) => state.positionSeconds);
  const durationSeconds = usePlayerStore((state) => state.durationSeconds);

  if (!activeTrack) {
    return null;
  }

  const isRadio = activeTrack.sourceType === 'radio';
  const progressRatio =
    !isRadio && durationSeconds > 0
      ? Math.min(1, Math.max(0, positionSeconds / durationSeconds))
      : 0;

  return (
    <View style={styles.wrapper}>
      {!isRadio && durationSeconds > 0 && (
        <View style={styles.progressBarTrack}>
          <View
            style={[styles.progressBarFill, { width: `${progressRatio * 100}%` }]}
          />
        </View>
      )}
      <TouchableOpacity
        style={styles.container}
        activeOpacity={0.9}
        onPress={onOpenFullPlayer}>
        <View style={styles.artworkBox}>
          {activeTrack.artworkUrl ? (
            <Image
              source={{ uri: activeTrack.artworkUrl }}
              style={styles.artworkImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.artworkFallback}>
              <Text style={styles.artworkFallbackText}>
                {activeTrack.title.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.infoColumn}>
          <Text style={styles.title} numberOfLines={1}>
            {activeTrack.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {isRadio
              ? `LIVE • ${activeTrack.subtitle}`
              : `${formatTime(positionSeconds)} / ${formatTime(durationSeconds)}`}
          </Text>
        </View>

        <View style={styles.controlsRow}>
          {!isRadio && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => {
                seekRelativeSeconds(-30).catch(() => {});
              }}>
              <Text style={styles.skipButtonText}>-30</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => {
              togglePlaybackState().catch(() => {});
            }}>
            <Text style={styles.playButtonText}>
              {isBuffering ? '...' : isPlaying ? 'PAUSE' : 'PLAY'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.surfaceElevated,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  progressBarTrack: {
    height: 3,
    width: '100%',
    backgroundColor: COLORS.surface,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  artworkBox: {
    width: 42,
    height: 42,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    marginRight: 12,
  },
  artworkImage: {
    width: '100%',
    height: '100%',
  },
  artworkFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkFallbackText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  infoColumn: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skipButton: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
  },
  skipButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  playButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 64,
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.background,
  },
});
