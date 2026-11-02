import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StationList } from '@widgets/station-list';
import { StationFiltersBar } from '@features/filter-stations';
import { StreamRecoveryBanner } from '@features/stream-recovery';
import { Banner, COLORS, ScreenContainer } from '@shared/ui';
import { useRadioCatalogPage } from './model';

export function RadioCatalogPage(): React.JSX.Element {
  const {
    stations,
    stationCountLabel,
    activeStationId,
    queuedStationIds,
    queueCount,
    isPlaying,
    isBuffering,
    isLoading,
    errorMessage,
    playbackError,
    onRefresh,
    onSelectStation,
    onToggleFavorite,
    onAddToQueue,
    onOpenQueueModal,
    onDismissPlaybackError,
  } = useRadioCatalogPage();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Radio Directory</Text>
          <Text style={styles.subtitle}>{stationCountLabel}</Text>
        </View>
        <TouchableOpacity style={styles.queueHeaderBtn} onPress={onOpenQueueModal}>
          <Text style={styles.queueHeaderBtnText}>QUEUE ({queueCount})</Text>
        </TouchableOpacity>
      </View>

      {playbackError && (
        <Banner
          message={playbackError}
          variant="error"
          onDismiss={onDismissPlaybackError}
          style={styles.playbackErrorBanner}
        />
      )}

      <StreamRecoveryBanner />
      <StationFiltersBar />
      <StationList
        stations={stations}
        activeStationId={activeStationId}
        queuedStationIds={queuedStationIds}
        isPlaying={isPlaying}
        isBuffering={isBuffering}
        isLoading={isLoading}
        errorMessage={errorMessage}
        onRefresh={onRefresh}
        onSelectStation={onSelectStation}
        onToggleFavorite={onToggleFavorite}
        onAddToQueue={onAddToQueue}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  queueHeaderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  queueHeaderBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  playbackErrorBanner: {
    position: 'absolute',
    top: 66,
    left: 16,
    right: 16,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
});
