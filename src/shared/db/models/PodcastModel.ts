import { Model, Query } from '@nozbe/watermelondb';
import { children, field, text } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';
import { TableName } from '../schema';
import { EpisodeModel } from './EpisodeModel';

export class PodcastModel extends Model {
  static table = TableName.Podcasts;

  static associations: Associations = {
    [TableName.Episodes]: { type: 'has_many', foreignKey: 'podcast_id' },
  };

  @text('feed_url') feedUrl!: string;
  @text('title') title!: string;
  @text('author') author!: string;
  @text('description') description!: string;
  @text('artwork_url') artworkUrl!: string;
  @field('etag') etag!: string | null;
  @field('last_modified') lastModified!: string | null;
  @field('subscribed_at') subscribedAt!: number;
  @field('updated_at') updatedAt!: number;

  @children(TableName.Episodes) episodes!: Query<EpisodeModel>;
}

