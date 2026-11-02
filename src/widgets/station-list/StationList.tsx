import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { RadioStation, StationCard } from '@entities/station';
import { COLORS } from '@shared/ui';
import { useStationList } from './model';

export interface StationListProps {
  stations: RadioStation[];
  activeStationId?: string | null;
  queuedStationIds?: ReadonlySet<string>;
  isPlaying?: boolean;
  isBuffering?: boolean;
  isLoading?: boolean;
  errorMessage?: string | null;
  onRefresh?: () => void;
  onSelectStation: (station: RadioStation) => void;
  onToggleFavorite: (station: RadioStation) => void;
  onAddToQueue: (station: RadioStation) => void;
}

export function StationList({
  stations,
  activeStationId = null,
  queuedStationIds,
  isPlaying = false,
  isBuffering = false,
  isLoading = false,
  errorMessage = null,
  onRefresh,
  onSelectStation,
  onToggleFavorite,
  onAddToQueue,
}: StationListProps): React.JSX.Element {
  const { viewState, items } = useStationList({
    stations,
    activeStationId,
    queuedStationIds,
    isLoading,
    errorMessage,
  });

  if (viewState === 'loading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.statusText}>Loading radio stations...</Text>
      </View>
    );
  }

  if (viewState === 'error') {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{errorMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.station.stationUuid}
      contentContainerStyle={styles.listContent}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        ) : undefined
      }
      renderItem={({ item }) => (
        <StationCard
          station={item.station}
          isCurrentStation={item.isCurrentStation}
          isPlaying={isPlaying}
          isBuffering={isBuffering}
          isQueued={item.isQueued}
          onPressPlay={onSelectStation}
          onPressToggleFavorite={onToggleFavorite}
          onPressAddToQueue={onAddToQueue}
        />
      )}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.statusText}>No stations found matching your criteria.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: COLORS.accent,
    textAlign: 'center',
  },
});

