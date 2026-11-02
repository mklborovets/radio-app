import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  Artwork,
  COLORS,
  PlayPauseButton,
  ProgressBar,
} from '@shared/ui';
import { useMiniPlayer } from './model';

export interface MiniPlayerProps {
  onOpenFullPlayer: () => void;
}

export function MiniPlayer({
  onOpenFullPlayer,
}: MiniPlayerProps): React.JSX.Element | null {
  const {
    activeTrack,
    isPlaying,
    isBuffering,
    showProgressBar,
    progressWidthPercent,
    initials,
    subtitleText,
    hasNextInQueue,
    hasPreviousInQueue,
    onSkipPrevious,
    onSkipNext,
    onTogglePlay,
  } = useMiniPlayer();

  if (!activeTrack) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      {showProgressBar && (
        <ProgressBar
          progress={progressWidthPercent}
          height={3}
          trackColor={COLORS.surface}
          fillColor={COLORS.primary}
          borderRadius={0}
        />
      )}
      <TouchableOpacity
        style={styles.container}
        activeOpacity={0.9}
        onPress={onOpenFullPlayer}>
        <Artwork
          uri={activeTrack.artworkUrl}
          fallbackText={initials}
          size={44}
          borderRadius={8}
          style={styles.artworkBox}
        />

        <View style={styles.infoColumn}>
          <Text style={styles.title} numberOfLines={1}>
            {activeTrack.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitleText}
          </Text>
        </View>

        <View style={styles.controlsRow}>
          {hasPreviousInQueue && (
            <TouchableOpacity
              style={styles.navButton}
              onPress={onSkipPrevious}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
              <Text style={styles.navIcon}>◀◀</Text>
            </TouchableOpacity>
          )}

          <PlayPauseButton
            isPlaying={isPlaying}
            isLoading={isBuffering}
            size="medium"
            variant="primary"
            onPress={onTogglePlay}
          />

          {hasNextInQueue && (
            <TouchableOpacity
              style={styles.navButton}
              onPress={onSkipNext}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
              <Text style={styles.navIcon}>▶▶</Text>
            </TouchableOpacity>
          )}
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
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  artworkBox: {
    backgroundColor: COLORS.surface,
    marginRight: 12,
  },
  infoColumn: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  navButton: {
    backgroundColor: COLORS.surface,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});
