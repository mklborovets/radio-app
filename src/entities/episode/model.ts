import { Q } from '@nozbe/watermelondb';
import { database, EpisodeDownloadStatus, EpisodeModel, TableName } from '@shared/db';

export interface EpisodeEntity {
  id: string;
  podcastId: string;
  guid: string;
  title: string;
  description: string;
  audioUrl: string;
  artworkUrl: string;
  duration: number;
  publishedAt: number;
  playbackPosition: number;
  isCompleted: boolean;
  lastPlayedAt: number | null;
  downloadStatus: EpisodeDownloadStatus;
  downloadProgress: number;
  localFilePath: string | null;
  fileSize: number;
  downloadedBytes: number;
}

export function mapEpisodeModelToEntity(model: EpisodeModel): EpisodeEntity {
  return {
    id: model.id,
    podcastId: model.podcastId,
    guid: model.guid,
    title: model.title,
    description: model.description,
    audioUrl: model.audioUrl,
    artworkUrl: model.artworkUrl,
    duration: model.duration,
    publishedAt: model.publishedAt,
    playbackPosition: model.playbackPosition,
    isCompleted: model.isCompleted,
    lastPlayedAt: model.lastPlayedAt,
    downloadStatus: model.downloadStatus,
    downloadProgress: model.downloadProgress,
    localFilePath: model.localFilePath,
    fileSize: model.fileSize,
    downloadedBytes: model.downloadedBytes,
  };
}

export async function queryPaginatedEpisodesForPodcast(
  podcastId: string,
  offset: number,
  limit: number,
): Promise<EpisodeEntity[]> {
  const collection = database.get<EpisodeModel>(TableName.Episodes);
  const models = await collection
    .query(
      Q.where('podcast_id', podcastId),
      Q.sortBy('published_at', Q.desc),
      Q.skip(offset),
      Q.take(limit),
    )
    .fetch();

  return models.map(mapEpisodeModelToEntity);
}

export async function countEpisodesForPodcast(podcastId: string): Promise<number> {
  const collection = database.get<EpisodeModel>(TableName.Episodes);
  return collection.query(Q.where('podcast_id', podcastId)).fetchCount();
}

export async function getEpisodeById(episodeId: string): Promise<EpisodeEntity | null> {
  const collection = database.get<EpisodeModel>(TableName.Episodes);
  try {
    const record = await collection.find(episodeId);
    return mapEpisodeModelToEntity(record);
  } catch {
    return null;
  }
}

