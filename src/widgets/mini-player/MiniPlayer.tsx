import React from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '@shared/ui';
import { useMiniPlayer } from './model';

export interface MiniPlayerProps {
  onOpenFullPlayer: () => void;
}

export function MiniPlayer({
  onOpenFullPlayer,
}: MiniPlayerProps): React.JSX.Element | null {
  const {
    activeTrack,
    isRadio,
    isPlaying,
    isBuffering,
    showProgressBar,
    progressWidthPercent,
    initials,
    subtitleText,
    hasNextInQueue,
    hasPreviousInQueue,
    onSkipBackward,
    onSkipPrevious,
    onSkipNext,
    onTogglePlay,
  } = useMiniPlayer();

  if (!activeTrack) {
    return null;
  }

  const hasValidArtwork =
    Boolean(activeTrack.artworkUrl) &&
    activeTrack.artworkUrl !== 'null' &&
    activeTrack.artworkUrl !== 'undefined' &&
    (activeTrack.artworkUrl.startsWith('http://') ||
      activeTrack.artworkUrl.startsWith('https://') ||
      activeTrack.artworkUrl.startsWith('file://'));

  return (
    <View style={styles.wrapper}>
      {showProgressBar && (
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progressWidthPercent}%` },
            ]}
          />
        </View>
      )}
      <TouchableOpacity
        style={styles.container}
        activeOpacity={0.9}
        onPress={onOpenFullPlayer}>
        <View style={styles.artworkBox}>
          {hasValidArtwork ? (
            <Image
              source={{ uri: activeTrack.artworkUrl }}
              style={styles.artworkImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.artworkFallback}>
              <Text style={styles.artworkFallbackText}>{initials}</Text>
            </View>
          )}
        </View>

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

          <TouchableOpacity
            style={styles.playButton}
            onPress={onTogglePlay}
            activeOpacity={0.85}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
            {isBuffering ? (
              <ActivityIndicator size="small" color={COLORS.background} />
            ) : isPlaying ? (
              <View style={styles.pauseIconContainer}>
                <View style={styles.pauseBar} />
                <View style={styles.pauseBar} />
              </View>
            ) : (
              <Text style={[styles.playIcon, styles.playIconOffset]}>▶</Text>
            )}
          </TouchableOpacity>

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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(244, 63, 94, 0.22)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.accent,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#FDA4AF',
    marginRight: 10,
  },
  errorCloseBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  errorCloseText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
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
    width: 44,
    height: 44,
    borderRadius: 8,
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
  playButton: {
    backgroundColor: COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.background,
  },
  playIconOffset: {
    marginLeft: 2,
  },
  pauseIconContainer: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseBar: {
    width: 3,
    height: 14,
    borderRadius: 1.5,
    backgroundColor: COLORS.background,
  },
});

