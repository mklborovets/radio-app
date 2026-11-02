import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  ActionMenuModal,
  Artwork,
  COLORS,
  MoreOptionsButton,
  PlayPauseButton,
} from '@shared/ui';
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

  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <View style={[styles.card, isCurrentStation && styles.cardActive]}>
      <TouchableOpacity
        style={styles.mainTouchable}
        activeOpacity={0.85}
        onPress={() => onPressPlay(station)}>
        <Artwork
          uri={station.faviconUrl}
          fallbackText={viewModel.initials}
          size={50}
          borderRadius={10}
          style={styles.logo}
        />

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

      <View style={styles.actionsCluster}>
        <PlayPauseButton
          isPlaying={viewModel.isLivePlaying}
          isLoading={viewModel.isConnecting}
          variant={
            viewModel.isConnecting
              ? 'connecting'
              : viewModel.isLivePlaying
              ? 'active'
              : 'default'
          }
          onPress={() => onPressPlay(station)}
        />

        <MoreOptionsButton onPress={() => setMenuVisible(true)} />
      </View>

      <ActionMenuModal
        visible={menuVisible}
        title={station.name}
        onClose={() => setMenuVisible(false)}
        closeLabel="CANCEL"
        options={[
          {
            label: station.isFavorite ? 'REMOVE FROM FAVORITES' : 'ADD TO FAVORITES',
            isActive: station.isFavorite,
            onPress: () => onPressToggleFavorite(station),
          },
          {
            label: isQueued ? 'REMOVE FROM QUEUE' : 'ADD TO QUEUE',
            isActive: isQueued,
            onPress: () => onPressAddToQueue(station),
          },
        ]}
      />
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
  logo: {
    marginRight: 12,
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
  actionsCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
