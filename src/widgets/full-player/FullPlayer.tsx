import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { QueueSheet } from '@widgets/queue-sheet';
import { PlaybackControlsPanel } from '@features/playback-controls';
import { SleepTimerControl } from '@features/sleep-timer';
import { StreamRecoveryBanner } from '@features/stream-recovery';
import { Artwork, Banner, COLORS } from '@shared/ui';
import { useFullPlayer, useTimelineScrubber, useVolumeSlider } from './model';

export interface FullPlayerProps {
  onClose: () => void;
}

export function FullPlayer({ onClose }: FullPlayerProps): React.JSX.Element {
  const {
    activeTrack,
    playbackError,
    isRadio,
    isBuffering,
    hasTimeline,
    headerTitle,
    liveBadgeLabel,
    initials,
    progressRatio,
    positionSeconds,
    effectiveDuration,
    formattedPosition,
    formattedDuration,
    isDownloaded,
    downloadEpisodeLabel,
    isStationFavorite,
    volume,
    onToggleDownloadEpisode,
    onToggleFavoriteStation,
    onScrubToRatio,
    onChangeVolume,
    onToggleMute,
    onDismissError,
  } = useFullPlayer();

  const [isScrollEnabled, setIsScrollEnabled] = useState(true);

  const scrubber = useTimelineScrubber({
    progressRatio,
    durationSeconds: effectiveDuration,
    positionSeconds,
    formattedPosition,
    onScrub: onScrubToRatio,
  });

  const volumeSlider = useVolumeSlider({
    volume,
    onChangeVolume,
    onToggleMute,
  });

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.closeButtonText}>CLOSE</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {playbackError && (
        <Banner
          message={playbackError}
          variant="error"
          onDismiss={onDismissError}
          style={styles.errorOverlayCard}
        />
      )}

      <StreamRecoveryBanner
        style={[
          styles.recoveryOverlayCard,
          Boolean(playbackError) && styles.recoveryOverlayWithOffset,
        ]}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={isScrollEnabled}
        showsVerticalScrollIndicator={false}>
        {activeTrack ? (
          <View style={styles.body}>
            <Artwork
              uri={activeTrack.artworkUrl}
              fallbackText={initials}
              size={200}
              borderRadius={18}
              style={styles.artworkCard}
            />

            <Text style={styles.trackTitle} numberOfLines={2}>
              {activeTrack.title}
            </Text>
            <Text style={styles.trackSubtitle} numberOfLines={1}>
              {activeTrack.subtitle}
            </Text>

            {hasTimeline ? (
              <View style={styles.timelineSection}>
                <View
                  ref={scrubber.trackRef}
                  style={styles.scrubberTouchArea}
                  onLayout={scrubber.onTrackLayout}
                  {...scrubber.panHandlers}>
                  <View style={styles.scrubberTrack}>
                    <View
                      style={[
                        styles.scrubberFill,
                        { width: `${scrubber.activePercent}%` },
                      ]}
                    />
                  </View>
                  <View
                    style={[
                      styles.scrubberThumb,
                      { left: `${scrubber.activePercent}%` },
                      scrubber.isScrubbing && styles.scrubberThumbActive,
                    ]}
                  />
                </View>

                <View style={styles.timeRow}>
                  <Text style={styles.timeLabel}>{scrubber.displayPosition}</Text>
                  <Text style={styles.timeLabel}>{formattedDuration}</Text>
                </View>
              </View>
            ) : (
              <View
                style={[
                  styles.liveBadge,
                  isBuffering && styles.liveBadgeConnecting,
                  Boolean(playbackError) && styles.liveBadgeError,
                ]}>
                <Text
                  style={[
                    styles.liveBadgeText,
                    isBuffering && styles.liveBadgeTextConnecting,
                    Boolean(playbackError) && styles.liveBadgeTextError,
                  ]}>
                  {liveBadgeLabel}
                </Text>
              </View>
            )}

            {isRadio && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[
                    styles.favoriteStationButton,
                    isStationFavorite && styles.favoriteStationButtonActive,
                  ]}
                  onPress={onToggleFavoriteStation}
                  activeOpacity={0.8}>
                  <Text
                    style={[
                      styles.favoriteStationButtonText,
                      isStationFavorite && styles.favoriteStationButtonTextActive,
                    ]}>
                    {isStationFavorite ? 'SAVED TO FAVORITES' : 'SAVE TO FAVORITES'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {!isRadio && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[
                    styles.downloadButton,
                    isDownloaded && styles.downloadButtonDone,
                  ]}
                  onPress={onToggleDownloadEpisode}
                  activeOpacity={0.8}>
                  <Text
                    style={[
                      styles.downloadButtonText,
                      isDownloaded && styles.downloadButtonTextDone,
                    ]}>
                    {downloadEpisodeLabel}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <PlaybackControlsPanel isRadioStream={isRadio} />

            <View style={styles.volumeRow}>
              <TouchableOpacity
                onPress={volumeSlider.onMutePress}
                style={styles.volumeLabelBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.volumeLabelText}>
                  {volumeSlider.isMuted ? 'MUTE' : 'VOL -'}
                </Text>
              </TouchableOpacity>

              <View
                ref={volumeSlider.trackRef}
                style={styles.volumeTouchArea}
                onLayout={volumeSlider.onTrackLayout}
                {...volumeSlider.panHandlers}>
                <View style={styles.volumeTrack}>
                  <View
                    style={[
                      styles.volumeFill,
                      { width: `${volumeSlider.volumePercent}%` },
                    ]}
                  />
                </View>
                <View
                  style={[
                    styles.volumeThumb,
                    { left: `${volumeSlider.volumePercent}%` },
                  ]}
                />
              </View>

              <TouchableOpacity
                onPress={volumeSlider.onMaxVolumePress}
                style={styles.volumeLabelBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.volumeLabelText}>VOL +</Text>
              </TouchableOpacity>
            </View>

            <SleepTimerControl />
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No track currently selected. Tap any radio station or episode to begin playback.
            </Text>
          </View>
        )}

        <View style={styles.queueWrapper}>
          <QueueSheet
            onDragStart={() => setIsScrollEnabled(false)}
            onDragEnd={() => setIsScrollEnabled(true)}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  closeButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSpacer: {
    width: 58,
  },
  errorOverlayCard: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    zIndex: 99,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  recoveryOverlayCard: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    zIndex: 98,
    paddingHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  recoveryOverlayWithOffset: {
    top: 130,
  },
  body: {
    alignItems: 'center',
  },
  artworkCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
  },
  trackTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  trackSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  timelineSection: {
    width: '100%',
    marginTop: 18,
  },
  scrubberTouchArea: {
    width: '100%',
    height: 32,
    justifyContent: 'center',
  },
  scrubberTrack: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  scrubberFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  scrubberThumb: {
    position: 'absolute',
    top: 9,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    marginLeft: -7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
  },
  scrubberThumbActive: {
    transform: [{ scale: 1.3 }],
    backgroundColor: COLORS.primary,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  timeLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  actionRow: {
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  favoriteStationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.35)',
    alignItems: 'center',
  },
  favoriteStationButtonActive: {
    backgroundColor: 'rgba(234, 179, 8, 0.22)',
    borderColor: 'rgba(234, 179, 8, 0.6)',
  },
  favoriteStationButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FACC15',
    letterSpacing: 0.5,
  },
  favoriteStationButtonTextActive: {
    color: '#FEF08A',
  },
  downloadButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    alignItems: 'center',
  },
  downloadButtonDone: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: 'rgba(34, 197, 94, 0.35)',
  },
  downloadButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  downloadButtonTextDone: {
    color: COLORS.success,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 8,
    gap: 10,
  },
  volumeLabelBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  volumeTouchArea: {
    flex: 1,
    height: 32,
    justifyContent: 'center',
  },
  volumeTrack: {
    width: '100%',
    height: 4,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 2,
    overflow: 'hidden',
  },
  volumeFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  volumeThumb: {
    position: 'absolute',
    top: 10,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    marginLeft: -6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  liveBadge: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  liveBadgeConnecting: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  liveBadgeError: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: 'rgba(244, 63, 94, 0.4)',
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  liveBadgeTextConnecting: {
    color: COLORS.warning,
  },
  liveBadgeTextError: {
    color: COLORS.accent,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  queueWrapper: {
    marginTop: 20,
    width: '100%',
  },
});
