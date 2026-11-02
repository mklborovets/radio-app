import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StationList } from '@widgets/station-list';
import { StationFiltersBar } from '@features/filter-stations';
import { StreamRecoveryBanner } from '@features/stream-recovery';
import { COLORS, ScreenContainer } from '@shared/ui';
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
        <View style={styles.playbackErrorBanner}>
          <Text style={styles.playbackErrorText}>{playbackError}</Text>
          <TouchableOpacity
            style={styles.dismissErrorBtn}
            onPress={onDismissPlaybackError}>
            <Text style={styles.dismissErrorBtnText}>DISMISS</Text>
          </TouchableOpacity>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(244, 63, 94, 0.16)',
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  playbackErrorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#FDA4AF',
    marginRight: 10,
  },
  dismissErrorBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: COLORS.accent,
  },
  dismissErrorBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});

