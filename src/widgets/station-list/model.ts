import { useMemo } from 'react';
import { RadioStation } from '@entities/station';

export type StationListViewState = 'loading' | 'error' | 'content';

export interface StationListItemViewModel {
  station: RadioStation;
  isCurrentStation: boolean;
  isQueued: boolean;
}

export interface UseStationListParams {
  stations: RadioStation[];
  activeStationId?: string | null;
  queuedStationIds?: ReadonlySet<string>;
  isLoading?: boolean;
  errorMessage?: string | null;
}

export interface UseStationListResult {
  viewState: StationListViewState;
  items: StationListItemViewModel[];
}

export function useStationList({
  stations,
  activeStationId = null,
  queuedStationIds,
  isLoading = false,
  errorMessage = null,
}: UseStationListParams): UseStationListResult {
  const viewState: StationListViewState =
    isLoading && stations.length === 0
      ? 'loading'
      : errorMessage && stations.length === 0
        ? 'error'
        : 'content';

  const items = useMemo<StationListItemViewModel[]>(() => {
    return stations.map((station) => ({
      station,
      isCurrentStation: activeStationId === station.stationUuid,
      isQueued: queuedStationIds ? queuedStationIds.has(station.stationUuid) : false,
    }));
  }, [activeStationId, queuedStationIds, stations]);

  return {
    viewState,
    items,
  };
}

