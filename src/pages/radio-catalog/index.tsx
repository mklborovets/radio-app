import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StationList } from '@widgets/station-list';
import { StationFiltersBar, useStationFilterStore } from '@features/filter-stations';
import { StreamRecoveryBanner } from '@features/stream-recovery';
import {
  startPlayableTrack,
  togglePlaybackState,
  usePlayerStore,
} from '@entities/player';
import { RadioStation } from '@entities/station';
import { COLORS, ScreenContainer } from '@shared/ui';

export function RadioCatalogPage(): React.JSX.Element {
  const stations = useStationFilterStore((state) => state.stations);
  const isLoading = useStationFilterStore((state) => state.isLoading);
  const errorMessage = useStationFilterStore((state) => state.errorMessage);
  const loadStations = useStationFilterStore((state) => state.loadStations);
  const toggleFavorite = useStationFilterStore((state) => state.toggleFavorite);

  const activeTrack = usePlayerStore((state) => state.activeTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);

  const handleSelectStation = useCallback(
    (station: RadioStation) => {
      if (activeTrack?.id === station.stationUuid) {
        togglePlaybackState().catch(() => {});
        return;
      }

      startPlayableTrack({
        id: station.stationUuid,
        title: station.name,
        subtitle: `${station.country || station.countryCode || 'Radio'} • ${station.codec}`,
        artworkUrl: station.faviconUrl,
        streamOrFileUrl: station.streamUrl,
        sourceType: 'radio',
        duration: 0,
      }).catch(() => {});
    },
    [activeTrack],
  );

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Radio Directory</Text>
      </View>
      <StreamRecoveryBanner />
      <StationFiltersBar />
      <StationList
        stations={stations}
        activeStationId={activeTrack?.sourceType === 'radio' ? activeTrack.id : null}
        isPlaying={isPlaying}
        isLoading={isLoading}
        errorMessage={errorMessage}
        onRefresh={() => {
          loadStations().catch(() => {});
        }}
        onSelectStation={handleSelectStation}
        onToggleFavorite={(station) => {
          toggleFavorite(station).catch(() => {});
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});
