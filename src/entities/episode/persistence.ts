import { Q } from '@nozbe/watermelondb';
import { ENV_CONFIG } from '@shared/config';
import { database, EpisodeModel, PodcastModel, TableName } from '@shared/db';
import { createThrottle } from '@shared/lib/throttle';

const COMPLETION_REMAINING_THRESHOLD_SECONDS = 15;

export async function persistEpisodePlaybackPositionImmediate(
  episodeId: string,
  positionSeconds: number,
  durationSeconds: number,
): Promise<void> {
  if (!episodeId || !Number.isFinite(positionSeconds) || positionSeconds < 0) {
    return;
  }

  const collection = database.get<EpisodeModel>(TableName.Episodes);
  try {
    const record = await collection.find(episodeId);
    const effectiveDuration =
      durationSeconds > 0 ? durationSeconds : record.duration;
    const isNearlyFinished =
      effectiveDuration > 0 &&
      effectiveDuration - positionSeconds <= COMPLETION_REMAINING_THRESHOLD_SECONDS;

    await database.write(async () => {
      await record.update((item) => {
        item.playbackPosition = isNearlyFinished
          ? 0
          : Math.floor(positionSeconds);
        if (effectiveDuration > 0 && item.duration === 0) {
          item.duration = Math.floor(effectiveDuration);
        }
        if (isNearlyFinished) {
          item.isCompleted = true;
        }
        item.lastPlayedAt = Date.now();
      });
    });
  } catch {
    return;
  }
}

const throttledPersistInternal = createThrottle(
  (episodeId: string, positionSeconds: number, durationSeconds: number) => {
    persistEpisodePlaybackPositionImmediate(
      episodeId,
      positionSeconds,
      durationSeconds,
    ).catch(() => {});
  },
  ENV_CONFIG.playbackPositionPersistenceIntervalMs,
);

export function recordEpisodePlaybackProgressThrottled(
  episodeId: string,
  positionSeconds: number,
  durationSeconds: number,
): void {
  throttledPersistInternal(episodeId, positionSeconds, durationSeconds);
}

export async function flushEpisodePlaybackProgress(
  episodeId: string,
  positionSeconds: number,
  durationSeconds: number,
): Promise<void> {
  throttledPersistInternal.cancel();
  await persistEpisodePlaybackPositionImmediate(
    episodeId,
    positionSeconds,
    durationSeconds,
  );
}

export interface LastPlayedEpisodeSummary {
  episodeId: string;
  podcastId: string;
  podcastTitle: string;
  title: string;
  artworkUrl: string;
  playbackUri: string;
  duration: number;
  playbackPosition: number;
}

export async function getLastPlayedInProgressEpisode(): Promise<LastPlayedEpisodeSummary | null> {
  const episodesCollection = database.get<EpisodeModel>(TableName.Episodes);
  const recent = await episodesCollection
    .query(
      Q.where('last_played_at', Q.notEq(null)),
      Q.where('playback_position', Q.gt(0)),
      Q.sortBy('last_played_at', Q.desc),
      Q.take(1),
    )
    .fetch();

  if (recent.length === 0) {
    return null;
  }

  const episode = recent[0];
  const podcastsCollection = database.get<PodcastModel>(TableName.Podcasts);
  let podcastTitle = 'Podcast Episode';
  try {
    const podcast = await podcastsCollection.find(episode.podcastId);
    podcastTitle = podcast.title;
  } catch {
    podcastTitle = 'Podcast Episode';
  }

  const playbackUri =
    episode.downloadStatus === 'completed' && episode.localFilePath
      ? `file://${episode.localFilePath}`
      : episode.audioUrl;

  return {
    episodeId: episode.id,
    podcastId: episode.podcastId,
    podcastTitle,
    title: episode.title,
    artworkUrl: episode.artworkUrl,
    playbackUri,
    duration: episode.duration,
    playbackPosition: episode.playbackPosition,
  };
}

