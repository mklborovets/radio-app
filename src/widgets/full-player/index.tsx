import React from 'react';
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
import { seekToPositionSeconds, usePlayerStore } from '@entities/player';
import { formatTime } from '@shared/lib/formatTime';
import { COLORS } from '@shared/ui';

export interface FullPlayerProps {
  onClose: () => void;
}

const SCRUB_PERCENTAGES: readonly number[] = [0, 0.25, 0.5, 0.75, 0.95];

export function FullPlayer({ onClose }: FullPlayerProps): React.JSX.Element {
  const activeTrack = usePlayerStore((state) => state.activeTrack);
  const positionSeconds = usePlayerStore((state) => state.positionSeconds);
  const durationSeconds = usePlayerStore((state) => state.durationSeconds);

  const isRadio = activeTrack?.sourceType === 'radio';
  const effectiveDuration =
    durationSeconds > 0 ? durationSeconds : activeTrack?.duration ?? 0;
  const progressRatio =
    !isRadio && effectiveDuration > 0
      ? Math.min(1, Math.max(0, positionSeconds / effectiveDuration))
      : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>DOWN</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isRadio ? 'Live Radio Stream' : 'Podcast Player'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {activeTrack ? (
        <View style={styles.body}>
          <View style={styles.artworkCard}>
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

          <Text style={styles.trackTitle} numberOfLines={2}>
            {activeTrack.title}
          </Text>
          <Text style={styles.trackSubtitle} numberOfLines={1}>
            {activeTrack.subtitle}
          </Text>

          {!isRadio && effectiveDuration > 0 ? (
            <View style={styles.timelineSection}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progressRatio * 100}%` },
                  ]}
                />
              </View>
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>{formatTime(positionSeconds)}</Text>
                <Text style={styles.timeLabel}>{formatTime(effectiveDuration)}</Text>
              </View>
              <View style={styles.quickSeekRow}>
                {SCRUB_PERCENTAGES.map((pct) => (
                  <TouchableOpacity
                    key={pct}
                    style={styles.quickSeekChip}
                    onPress={() => {
                      seekToPositionSeconds(effectiveDuration * pct).catch(() => {});
                    }}>
                    <Text style={styles.quickSeekText}>{Math.round(pct * 100)}%</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>LIVE BROADCAST</Text>
            </View>
          )}

          <PlaybackControlsPanel isRadioStream={Boolean(isRadio)} />
          <SleepTimerControl />

          <View style={styles.queueWrapper}>
            <QueueSheet />
          </View>
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Nothing is playing</Text>
          <Text style={styles.emptySubtitle}>
            Choose a radio station or podcast episode to begin playback.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 24,
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
    fontSize: 12,
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
  body: {
    alignItems: 'center',
  },
  artworkCard: {
    width: 220,
    height: 220,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
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
    fontSize: 48,
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
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: COLORS.surface,
  },
  quickSeekText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  liveBadge: {
    marginTop: 18,
    backgroundColor: 'rgba(244, 63, 94, 0.16)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
  },
  queueWrapper: {
    width: '100%',
    marginTop: 24,
  },
  emptyBox: {
    paddingVertical: 80,
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
