import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '@shared/ui';
import { RadioStation } from './model';

export interface StationCardProps {
  station: RadioStation;
  isCurrentStation: boolean;
  isPlaying: boolean;
  onPressPlay: (station: RadioStation) => void;
  onPressToggleFavorite: (station: RadioStation) => void;
}

export function StationCard({
  station,
  isCurrentStation,
  isPlaying,
  onPressPlay,
  onPressToggleFavorite,
}: StationCardProps): React.JSX.Element {
  const metadataParts: string[] = [];
  if (station.countryCode) {
    metadataParts.push(station.countryCode);
  }
  if (station.codec) {
    metadataParts.push(station.codec);
  }
  if (station.bitrate > 0) {
    metadataParts.push(`${station.bitrate} kbps`);
  }

  return (
    <TouchableOpacity
      style={[styles.card, isCurrentStation && styles.cardActive]}
      activeOpacity={0.85}
      onPress={() => onPressPlay(station)}>
      <View style={styles.logoContainer}>
        {station.faviconUrl ? (
          <Image
            source={{ uri: station.faviconUrl }}
            style={styles.logoImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.logoFallback}>
            <Text style={styles.logoFallbackText}>
              {station.name.slice(0, 2).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={1}>
          {station.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {metadataParts.join(' • ') || 'Live Radio Stream'}
        </Text>
        {station.tags.length > 0 && (
          <Text style={styles.tags} numberOfLines={1}>
            {station.tags.slice(0, 3).join(', ')}
          </Text>
        )}
      </View>

      <View style={styles.actions}>
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
            {station.isFavorite ? 'SAVED' : 'SAVE'}
          </Text>
        </TouchableOpacity>

        <View
          style={[
            styles.playBadge,
            isCurrentStation && isPlaying && styles.playBadgeActive,
          ]}>
          <Text style={styles.playBadgeText}>
            {isCurrentStation && isPlaying ? 'LIVE' : 'PLAY'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardActive: {
    borderColor: COLORS.primary,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
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
    marginRight: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  meta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  tags: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  actions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
  },
  favoriteButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  playBadgeActive: {
    backgroundColor: COLORS.primary,
  },
  playBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});

