import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const TableName = {
  Podcasts: 'podcasts',
  Episodes: 'episodes',
  StationsFavorites: 'stations_favorites',
} as const;

export const databaseSchema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: TableName.Podcasts,
      columns: [
        { name: 'feed_url', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'author', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'artwork_url', type: 'string' },
        { name: 'etag', type: 'string', isOptional: true },
        { name: 'last_modified', type: 'string', isOptional: true },
        { name: 'subscribed_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: TableName.Episodes,
      columns: [
        { name: 'podcast_id', type: 'string', isIndexed: true },
        { name: 'guid', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'audio_url', type: 'string' },
        { name: 'artwork_url', type: 'string' },
        { name: 'duration', type: 'number' },
        { name: 'published_at', type: 'number', isIndexed: true },
        { name: 'playback_position', type: 'number' },
        { name: 'is_completed', type: 'boolean' },
        { name: 'last_played_at', type: 'number', isOptional: true },
        { name: 'download_status', type: 'string', isIndexed: true },
        { name: 'download_progress', type: 'number' },
        { name: 'local_file_path', type: 'string', isOptional: true },
        { name: 'file_size', type: 'number' },
        { name: 'downloaded_bytes', type: 'number' },
      ],
    }),
    tableSchema({
      name: TableName.StationsFavorites,
      columns: [
        { name: 'station_uuid', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'stream_url', type: 'string' },
        { name: 'favicon_url', type: 'string' },
        { name: 'country', type: 'string' },
        { name: 'country_code', type: 'string' },
        { name: 'tags', type: 'string' },
        { name: 'bitrate', type: 'number' },
        { name: 'codec', type: 'string' },
        { name: 'added_at', type: 'number', isIndexed: true },
      ],
    }),
  ],
});

