import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { databaseSchema, TableName } from './schema';
import { databaseMigrations } from './migrations';
import { PodcastModel } from './models/PodcastModel';
import { EpisodeModel, EpisodeDownloadStatus } from './models/EpisodeModel';
import { StationFavoriteModel } from './models/StationFavoriteModel';

const sqliteAdapter = new SQLiteAdapter({
  schema: databaseSchema,
  migrations: databaseMigrations,
  dbName: 'radio_podcast_player_db',
  jsi: true,
  onSetUpError: () => {
    throw new Error('Failed to initialize WatermelonDB SQLite JSI adapter');
  },
});

export const database = new Database({
  adapter: sqliteAdapter,
  modelClasses: [PodcastModel, EpisodeModel, StationFavoriteModel],
});

export {
  databaseSchema,
  databaseMigrations,
  TableName,
  PodcastModel,
  EpisodeModel,
  StationFavoriteModel,
};
export type { EpisodeDownloadStatus };
