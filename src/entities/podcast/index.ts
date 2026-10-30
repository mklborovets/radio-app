import { Q } from '@nozbe/watermelondb';
import { database, PodcastModel, TableName } from '@shared/db';

export interface PodcastEntity {
  id: string;
  feedUrl: string;
  title: string;
  author: string;
  description: string;
  artworkUrl: string;
  etag: string | null;
  lastModified: string | null;
  subscribedAt: number;
  updatedAt: number;
}

export function mapPodcastModelToEntity(model: PodcastModel): PodcastEntity {
  return {
    id: model.id,
    feedUrl: model.feedUrl,
    title: model.title,
    author: model.author,
    description: model.description,
    artworkUrl: model.artworkUrl,
    etag: model.etag,
    lastModified: model.lastModified,
    subscribedAt: model.subscribedAt,
    updatedAt: model.updatedAt,
  };
}

export async function getSubscribedPodcasts(): Promise<PodcastEntity[]> {
  const collection = database.get<PodcastModel>(TableName.Podcasts);
  const records = await collection.query(Q.sortBy('subscribed_at', Q.desc)).fetch();
  return records.map(mapPodcastModelToEntity);
}

export async function getPodcastById(podcastId: string): Promise<PodcastEntity | null> {
  const collection = database.get<PodcastModel>(TableName.Podcasts);
  try {
    const record = await collection.find(podcastId);
    return mapPodcastModelToEntity(record);
  } catch {
    return null;
  }
}
