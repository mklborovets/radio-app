import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '@shared/ui';
import { getStationCardViewModel, RadioStation } from './model';

export interface StationCardProps {
  station: RadioStation;
  isCurrentStation: boolean;
  isPlaying: boolean;
  isBuffering: boolean;
  isQueued: boolean;
  onPressPlay: (station: RadioStation) => void;
  onPressToggleFavorite: (station: RadioStation) => void;
  onPressAddToQueue: (station: RadioStation) => void;
}

export function StationCard({
  station,
  isCurrentStation,
  isPlaying,
  isBuffering,
  isQueued,
  onPressPlay,
  onPressToggleFavorite,
  onPressAddToQueue,
}: StationCardProps): React.JSX.Element {
  const viewModel = getStationCardViewModel(
    station,
    isCurrentStation,
    isPlaying,
    isBuffering,
    isQueued,
  );

  const hasValidFavicon =
    Boolean(station.faviconUrl) &&
    station.faviconUrl !== 'null' &&
    station.faviconUrl !== 'undefined' &&
    (station.faviconUrl.startsWith('http://') ||
      station.faviconUrl.startsWith('https://') ||
      station.faviconUrl.startsWith('file://'));

  return (
    <View style={[styles.card, isCurrentStation && styles.cardActive]}>
      <TouchableOpacity
        style={styles.mainTouchable}
        activeOpacity={0.85}
        onPress={() => onPressPlay(station)}>
        <View style={styles.logoContainer}>
          {hasValidFavicon ? (
            <Image
              source={{ uri: station.faviconUrl }}
              style={styles.logoImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.logoFallback}>
              <Text style={styles.logoFallbackText}>{viewModel.initials}</Text>
            </View>
          )}
        </View>

        <View style={styles.details}>
          <Text style={styles.name} numberOfLines={1}>
            {station.name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {viewModel.metadataText}
          </Text>
          {viewModel.tagsText && (
            <Text style={styles.tags} numberOfLines={1}>
              {viewModel.tagsText}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.actionsColumn}>
        <View style={styles.topActionsRow}>
          <TouchableOpacity
            style={[styles.queueButton, isQueued && styles.queueButtonActive]}
            onPress={() => onPressAddToQueue(station)}>
            <Text style={[styles.queueText, isQueued && styles.queueTextActive]}>
              {viewModel.queueLabel}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.favoriteButton,
              station.isFavorite && styles.favoriteButtonActive,
            ]}
            onPress={() => onPressToggleFavorite(station)}>
            <Text
              style={[
                styles.favoriteText,
                station.isFavorite && styles.favoriteTextActive,
              ]}>
              {viewModel.favoriteLabel}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.playBadge,
            viewModel.isLivePlaying && styles.playBadgeActive,
            viewModel.isConnecting && styles.playBadgeConnecting,
          ]}
          onPress={() => onPressPlay(station)}>
          <Text
            style={[
              styles.playBadgeText,
              viewModel.isLivePlaying && styles.playBadgeTextActive,
            ]}>
            {viewModel.playBadgeLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#162338',
  },
  mainTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  logoContainer: {
    width: 50,
    height: 50,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceElevated,
    marginRight: 12,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoFallbackText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  meta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  tags: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  actionsColumn: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  queueButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceElevated,
  },
  queueButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  queueText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  queueTextActive: {
    color: COLORS.primary,
  },
  favoriteButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  favoriteButtonActive: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
  },
  favoriteText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  favoriteTextActive: {
    color: COLORS.accent,
  },
  playBadge: {
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 74,
    alignItems: 'center',
  },
  playBadgeActive: {
    backgroundColor: COLORS.primary,
  },
  playBadgeConnecting: {
    backgroundColor: COLORS.warning,
  },
  playBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  playBadgeTextActive: {
    color: COLORS.background,
  },
});
