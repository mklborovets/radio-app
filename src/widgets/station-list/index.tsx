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

export interface StationListProps {
  stations: RadioStation[];
  activeStationId?: string | null;
  isPlaying?: boolean;
  isLoading?: boolean;
  errorMessage?: string | null;
  onRefresh?: () => void;
  onSelectStation?: (station: RadioStation) => void;
  onToggleFavorite?: (station: RadioStation) => void;
}

export function StationList({
  stations,
  activeStationId = null,
  isPlaying = false,
  isLoading = false,
  errorMessage = null,
  onRefresh,
  onSelectStation = () => {},
  onToggleFavorite = () => {},
}: StationListProps): React.JSX.Element {
  if (isLoading && stations.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.statusText}>Loading radio stations...</Text>
      </View>
    );
  }

  if (errorMessage && stations.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{errorMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={stations}
      keyExtractor={(item) => item.stationUuid}
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
          station={item}
          isCurrentStation={activeStationId === item.stationUuid}
          isPlaying={isPlaying}
          onPressPlay={onSelectStation}
          onPressToggleFavorite={onToggleFavorite}
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
