import { createContext, useContext, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Database } from '@nozbe/watermelondb';
import { useStreamGuardCoordinator } from '@features/stream-recovery';
import { ensureTrackPlayerInitialized, usePlayerStore } from '@entities/player';
import {
  flushEpisodePlaybackProgress,
  getLastPlayedInProgressEpisode,
} from '@entities/episode';
import { database } from '@shared/db';

export const DatabaseContext = createContext<Database>(database);

export function useDatabase(): Database {
  return useContext(DatabaseContext);
}

export function usePlayerLifecycle(): void {
  useStreamGuardCoordinator();

  useEffect(() => {
    const initializeAndRestore = async (): Promise<void> => {
      await ensureTrackPlayerInitialized();
      const store = usePlayerStore.getState();
      if (store.activeTrack) {
        return;
      }

      const lastEpisode = await getLastPlayedInProgressEpisode();
      if (!lastEpisode) {
        return;
      }

      const restoredTrack = {
        id: lastEpisode.episodeId,
        title: lastEpisode.title,
        subtitle: lastEpisode.podcastTitle,
        artworkUrl: lastEpisode.artworkUrl,
        streamOrFileUrl: lastEpisode.playbackUri,
        sourceType: 'episode' as const,
        duration: lastEpisode.duration,
        episodeId: lastEpisode.episodeId,
        podcastId: lastEpisode.podcastId,
      };

      store.setActiveTrack(restoredTrack);
      store.setQueue([restoredTrack]);
      store.setProgress(lastEpisode.playbackPosition, lastEpisode.duration);
    };

    initializeAndRestore().catch(() => {});
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus): void => {
      if (nextState === 'background' || nextState === 'inactive') {
        const store = usePlayerStore.getState();
        const active = store.activeTrack;
        if (active && active.sourceType === 'episode') {
          const episodeId = active.episodeId ?? active.id;
          flushEpisodePlaybackProgress(
            episodeId,
            store.positionSeconds,
            store.durationSeconds || active.duration,
          ).catch(() => {});
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);
}

