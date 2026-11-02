import { Model, Q } from '@nozbe/watermelondb';
import { PodcastEntity, mapPodcastModelToEntity } from '@entities/podcast';
import { database, EpisodeModel, PodcastModel, TableName } from '@shared/db';
import { fetchAndParseRssFeed, ParsedPodcastFeed } from './parser';

const BATCH_CHUNK_SIZE = 250;

export async function persistParsedFeedInBatches(
  parsedFeed: ParsedPodcastFeed,
): Promise<PodcastEntity> {
  const podcastsCollection = database.get<PodcastModel>(TableName.Podcasts);
  const episodesCollection = database.get<EpisodeModel>(TableName.Episodes);

  const existingPodcasts = await podcastsCollection
    .query(Q.where('feed_url', parsedFeed.feedUrl))
    .fetch();

  const now = Date.now();
  let targetPodcast: PodcastModel;

  if (existingPodcasts.length > 0) {
    targetPodcast = existingPodcasts[0];
    await database.write(async () => {
      await targetPodcast.update((record) => {
        record.title = parsedFeed.title;
        record.author = parsedFeed.author;
        record.description = parsedFeed.description;
        record.artworkUrl = parsedFeed.artworkUrl;
        record.etag = parsedFeed.etag;
        record.lastModified = parsedFeed.lastModified;
        record.updatedAt = now;
      });
    });
  } else {
    targetPodcast = await database.write(async () => {
      return podcastsCollection.create((record) => {
        record.feedUrl = parsedFeed.feedUrl;
        record.title = parsedFeed.title;
        record.author = parsedFeed.author;
        record.description = parsedFeed.description;
        record.artworkUrl = parsedFeed.artworkUrl;
        record.etag = parsedFeed.etag;
        record.lastModified = parsedFeed.lastModified;
        record.subscribedAt = now;
        record.updatedAt = now;
      });
    });
  }

  const existingEpisodes = await episodesCollection
    .query(Q.where('podcast_id', targetPodcast.id))
    .fetch();
  const existingByGuid = new Map<string, EpisodeModel>();
  existingEpisodes.forEach((ep) => {
    existingByGuid.set(ep.guid, ep);
  });

  const operations: Model[] = [];

  parsedFeed.episodes.forEach((item) => {
    const existing = existingByGuid.get(item.guid);
    if (existing) {
      operations.push(
        existing.prepareUpdate((record) => {
          record.title = item.title;
          record.description = item.description;
          record.audioUrl = item.audioUrl;
          record.artworkUrl = item.artworkUrl || parsedFeed.artworkUrl;
          if (item.duration > 0) {
            record.duration = item.duration;
          }
          if (item.fileSize > 0 && record.fileSize === 0) {
            record.fileSize = item.fileSize;
          }
        }),
      );
    } else {
      operations.push(
        episodesCollection.prepareCreate((record) => {
          record.podcastId = targetPodcast.id;
          record.guid = item.guid;
          record.title = item.title;
          record.description = item.description;
          record.audioUrl = item.audioUrl;
          record.artworkUrl = item.artworkUrl || parsedFeed.artworkUrl;
          record.duration = item.duration;
          record.publishedAt = item.publishedAt;
          record.playbackPosition = 0;
          record.isCompleted = false;
          record.lastPlayedAt = null;
          record.downloadStatus = 'none';
          record.downloadProgress = 0;
          record.localFilePath = null;
          record.fileSize = item.fileSize;
          record.downloadedBytes = 0;
        }),
      );
    }
  });

  for (let offset = 0; offset < operations.length; offset += BATCH_CHUNK_SIZE) {
    const chunk = operations.slice(offset, offset + BATCH_CHUNK_SIZE);
    await database.write(async () => {
      await database.batch(chunk);
    });
  }

  return mapPodcastModelToEntity(targetPodcast);
}

export async function subscribeOrRefreshPodcastFeed(
  feedUrl: string,
): Promise<{ podcast: PodcastEntity; wasModified: boolean; isNewSubscription: boolean }> {
  const normalizedUrl = feedUrl.trim();
  const podcastsCollection = database.get<PodcastModel>(TableName.Podcasts);
  const existing = await podcastsCollection
    .query(Q.where('feed_url', normalizedUrl))
    .fetch();

  const existingRecord = existing.length > 0 ? existing[0] : null;
  const isNewSubscription = !existingRecord;
  const result = await fetchAndParseRssFeed(
    normalizedUrl,
    existingRecord?.etag,
    existingRecord?.lastModified,
  );

  if (result.notModified && existingRecord) {
    return {
      podcast: mapPodcastModelToEntity(existingRecord),
      wasModified: false,
      isNewSubscription,
    };
  }

  if (!result.feed) {
    throw new Error('Empty RSS feed response');
  }

  const savedPodcast = await persistParsedFeedInBatches(result.feed);
  return {
    podcast: savedPodcast,
    wasModified: true,
    isNewSubscription,
  };
}

