import React, { useState } from 'react';
import {
  Image,
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
import { COLORS } from '@shared/ui';
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

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={isScrollEnabled}
        showsVerticalScrollIndicator={false}>
        {playbackError && (
          <View style={styles.errorCard}>
            <Text style={styles.errorCardText}>{playbackError}</Text>
            <TouchableOpacity style={styles.errorDismissBtn} onPress={onDismissError}>
              <Text style={styles.errorDismissText}>DISMISS</Text>
            </TouchableOpacity>
          </View>
        )}

      {activeTrack ? (
        <View style={styles.body}>
          <View style={styles.artworkCard}>
            {Boolean(activeTrack.artworkUrl) &&
            activeTrack.artworkUrl !== 'null' &&
            activeTrack.artworkUrl !== 'undefined' &&
            (activeTrack.artworkUrl.startsWith('http://') ||
              activeTrack.artworkUrl.startsWith('https://') ||
              activeTrack.artworkUrl.startsWith('file://')) ? (
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

          <Text style={styles.trackTitle} numberOfLines={2}>
            {activeTrack.title}
          </Text>
          <Text style={styles.trackSubtitle} numberOfLines={1}>
            {activeTrack.subtitle}
          </Text>

          {hasTimeline ? (
            <View style={styles.timelineSection}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progressWidthPercent}%` },
                  ]}
                />
              </View>
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

          {isRadio && (
            <View style={styles.recoveryBannerBox}>
              <StreamRecoveryBanner />
            </View>
          )}

          <PlaybackControlsPanel isRadioStream={isRadio} />
          <SleepTimerControl />
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Nothing is playing</Text>
          <Text style={styles.emptySubtitle}>
            Choose a radio station or podcast episode to begin playback.
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
    backgroundColor: COLORS.background,
    zIndex: 10,
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  closeButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  headerSpacer: {
    width: 64,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(244, 63, 94, 0.16)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.accent,
    padding: 12,
    marginBottom: 16,
  },
  errorCardText: {
    flex: 1,
    fontSize: 12,
    color: '#FDA4AF',
    fontWeight: '600',
    marginRight: 10,
  },
  errorDismissBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: COLORS.accent,
  },
  errorDismissText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  body: {
    alignItems: 'center',
  },
  artworkCard: {
    width: 200,
    height: 200,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
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
    fontSize: 44,
    fontWeight: '700',
    color: COLORS.primary,
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
  progressTrack: {
    height: 6,
    width: '100%',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
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
    color: '#22c55e',
  },
  liveBadge: {
    marginTop: 16,
    backgroundColor: 'rgba(244, 63, 94, 0.16)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  liveBadgeConnecting: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderColor: COLORS.warning,
  },
  liveBadgeError: {
    backgroundColor: 'rgba(244, 63, 94, 0.16)',
    borderColor: COLORS.accent,
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  liveBadgeTextConnecting: {
    color: COLORS.warning,
  },
  liveBadgeTextError: {
    color: COLORS.accent,
  },
  recoveryBannerBox: {
    width: '100%',
    marginTop: 14,
  },
  queueWrapper: {
    width: '100%',
    marginTop: 24,
  },
  emptyBox: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});

