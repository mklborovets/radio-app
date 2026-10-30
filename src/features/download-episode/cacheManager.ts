import { Model, Q } from '@nozbe/watermelondb';
import { EpisodeEntity, mapEpisodeModelToEntity } from '@entities/episode';
import { ENV_CONFIG } from '@shared/config';
import { database, EpisodeModel, PodcastModel, TableName } from '@shared/db';
import { deleteEpisodeDownloadedFiles } from './downloader';

export interface CacheUsageSummary {
  totalUsedBytes: number;
  maxLimitBytes: number;
  downloadedCount: number;
}

export async function getDownloadedOrActiveEpisodes(): Promise<EpisodeEntity[]> {
  const collection = database.get<EpisodeModel>(TableName.Episodes);
  const records = await collection
    .query(
      Q.where('download_status', Q.notEq('none')),
      Q.sortBy('published_at', Q.desc),
    )
    .fetch();

  return records.map(mapEpisodeModelToEntity);
}

export async function calculateCacheUsageSummary(): Promise<CacheUsageSummary> {
  const collection = database.get<EpisodeModel>(TableName.Episodes);
  const completedRecords = await collection
    .query(Q.where('download_status', 'completed'))
    .fetch();

  let totalUsedBytes = 0;
  completedRecords.forEach((record) => {
    const size = record.downloadedBytes > 0 ? record.downloadedBytes : record.fileSize;
    totalUsedBytes += size;
  });

  return {
    totalUsedBytes,
    maxLimitBytes: ENV_CONFIG.maxCacheSizeBytes,
    downloadedCount: completedRecords.length,
  };
}

export async function enforceCacheStorageLimitLru(
  maxAllowedBytes: number = ENV_CONFIG.maxCacheSizeBytes,
  protectedEpisodeId?: string,
): Promise<number> {
  const collection = database.get<EpisodeModel>(TableName.Episodes);
  const completedRecords = await collection
    .query(Q.where('download_status', 'completed'))
    .fetch();

  let currentTotalBytes = 0;
  completedRecords.forEach((record) => {
    const size = record.downloadedBytes > 0 ? record.downloadedBytes : record.fileSize;
    currentTotalBytes += size;
  });

  if (currentTotalBytes <= maxAllowedBytes) {
    return 0;
  }

  const evictionCandidates = [...completedRecords]
    .filter((item) => item.id !== protectedEpisodeId)
    .sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? -1 : 1;
      }
      const aPlayedAt = a.lastPlayedAt ?? 0;
      const bPlayedAt = b.lastPlayedAt ?? 0;
      if (aPlayedAt !== bPlayedAt) {
        return aPlayedAt - bPlayedAt;
      }
      return a.publishedAt - b.publishedAt;
    });

  let freedBytes = 0;
  for (const candidate of evictionCandidates) {
    if (currentTotalBytes <= maxAllowedBytes) {
      break;
    }

    const candidateSize =
      candidate.downloadedBytes > 0 ? candidate.downloadedBytes : candidate.fileSize;
    await deleteEpisodeDownloadedFiles(candidate.id);
    currentTotalBytes = Math.max(0, currentTotalBytes - candidateSize);
    freedBytes += candidateSize;
  }

  return freedBytes;
}

export async function unsubscribeAndDeletePodcastCascade(
  podcastId: string,
): Promise<void> {
  const podcastsCollection = database.get<PodcastModel>(TableName.Podcasts);
  const episodesCollection = database.get<EpisodeModel>(TableName.Episodes);

  const episodes = await episodesCollection
    .query(Q.where('podcast_id', podcastId))
    .fetch();

  for (const episode of episodes) {
    if (episode.downloadStatus !== 'none' || episode.localFilePath) {
      await deleteEpisodeDownloadedFiles(episode.id);
    }
  }

  await database.write(async () => {
    const destroyOps: Model[] = episodes.map((ep) => ep.prepareDestroyPermanently());
    try {
      const podcastRecord = await podcastsCollection.find(podcastId);
      destroyOps.push(podcastRecord.prepareDestroyPermanently());
    } catch {}

    if (destroyOps.length > 0) {
      await database.batch(...destroyOps);
    }
  });
}
