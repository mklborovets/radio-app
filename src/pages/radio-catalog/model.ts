import { useCallback, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStationFilterStore } from '@features/filter-stations';
import {
  appendTrackToPlaybackQueue,
  PlayableTrack,
  startPlayableTrack,
  togglePlaybackState,
  usePlayerStore,
} from '@entities/player';
import { RadioStation } from '@entities/station';
import { RootStackParamList } from '@shared/config';

export function mapRadioStationToPlayableTrack(
  station: RadioStation,
): PlayableTrack {
  return {
    id: station.stationUuid,
    title: station.name,
    subtitle: `${station.country || station.countryCode || 'Radio'} • ${station.codec}`,
    artworkUrl: station.faviconUrl,
    streamOrFileUrl: station.streamUrl,
    fallbackStreamUrl: station.fallbackStreamUrl || undefined,
    sourceType: 'radio',
    duration: 0,
  };
}

export interface UseRadioCatalogPageResult {
  stations: RadioStation[];
  stationCountLabel: string;
  activeStationId: string | null;
  queuedStationIds: ReadonlySet<string>;
  queueCount: number;
  isPlaying: boolean;
  isBuffering: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  playbackError: string | null;
  onRefresh: () => void;
  onSelectStation: (station: RadioStation) => void;
  onToggleFavorite: (station: RadioStation) => void;
  onAddToQueue: (station: RadioStation) => void;
  onOpenQueueModal: () => void;
  onDismissPlaybackError: () => void;
}

export function useRadioCatalogPage(): UseRadioCatalogPageResult {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const stations = useStationFilterStore((state) => state.stations);
  const isLoading = useStationFilterStore((state) => state.isLoading);
  const errorMessage = useStationFilterStore((state) => state.errorMessage);
  const loadStations = useStationFilterStore((state) => state.loadStations);
  const toggleFavorite = useStationFilterStore((state) => state.toggleFavorite);

  const activeTrack = usePlayerStore((state) => state.activeTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isBuffering = usePlayerStore((state) => state.isBuffering);
  const playbackError = usePlayerStore((state) => state.playbackError);
  const queue = usePlayerStore((state) => state.queue);
  const setPlaybackError = usePlayerStore((state) => state.setPlaybackError);

  const queuedStationIds = useMemo<ReadonlySet<string>>(() => {
    return new Set(queue.map((item) => item.id));
  }, [queue]);

  const onRefresh = useCallback(() => {
    loadStations().catch(() => {});
  }, [loadStations]);

  const onToggleFavorite = useCallback(
    (station: RadioStation) => {
      toggleFavorite(station).catch(() => {});
    },
    [toggleFavorite],
  );

  const onSelectStation = useCallback(
    (station: RadioStation) => {
      if (activeTrack?.id === station.stationUuid) {
        togglePlaybackState().catch(() => {});
        return;
      }

      const playable = mapRadioStationToPlayableTrack(station);
      startPlayableTrack(playable).catch(() => {});
    },
    [activeTrack],
  );

  const onAddToQueue = useCallback((station: RadioStation) => {
    const playable = mapRadioStationToPlayableTrack(station);
    appendTrackToPlaybackQueue(playable).catch(() => {});
  }, []);

  const onOpenQueueModal = useCallback(() => {
    navigation.navigate('PlayerModal');
  }, [navigation]);

  const onDismissPlaybackError = useCallback(() => {
    setPlaybackError(null);
  }, [setPlaybackError]);

  return {
    stations,
    stationCountLabel: `${stations.length} live stations available`,
    activeStationId: activeTrack?.sourceType === 'radio' ? activeTrack.id : null,
    queuedStationIds,
    queueCount: queue.length,
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
  };
}
