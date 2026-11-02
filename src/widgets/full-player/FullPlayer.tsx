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
import { Artwork, Banner, COLORS, ProgressBar } from '@shared/ui';
import { useFullPlayer } from './model';

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
    progressWidthPercent,
    formattedPosition,
    formattedDuration,
    scrubOptions,
    isDownloaded,
    downloadEpisodeLabel,
    onToggleDownloadEpisode,
    onScrubToRatio,
    onDismissError,
  } = useFullPlayer();
  const [isScrollEnabled, setIsScrollEnabled] = useState(true);

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

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={isScrollEnabled}
        showsVerticalScrollIndicator={false}
        canCancelContentTouches={false}>

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
              <ProgressBar
                progress={progressWidthPercent}
                height={6}
                borderRadius={3}
              />
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>{formattedPosition}</Text>
                <Text style={styles.timeLabel}>{formattedDuration}</Text>
              </View>
              <View style={styles.quickSeekRow}>
                {scrubOptions.map((option) => (
                  <TouchableOpacity
                    key={option.ratio}
                    style={styles.quickSeekChip}
                    onPress={() => onScrubToRatio(option.ratio)}>
                    <Text style={styles.quickSeekText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
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

          {!isRadio && (
            <View style={styles.episodeActionRow}>
              <TouchableOpacity
                style={[
                  styles.downloadButton,
                  isDownloaded && styles.downloadButtonDone,
                ]}
                onPress={onToggleDownloadEpisode}>
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

          <StreamRecoveryBanner />
          <PlaybackControlsPanel isRadioStream={isRadio} />
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
    paddingBottom: 40,
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
    marginTop: 22,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  quickSeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  quickSeekChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickSeekText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  episodeActionRow: {
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
