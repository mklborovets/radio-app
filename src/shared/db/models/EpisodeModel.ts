import { Model, Relation } from '@nozbe/watermelondb';
import { field, immutableRelation, text } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';
import { TableName } from '../schema';
import { PodcastModel } from './PodcastModel';

export type EpisodeDownloadStatus = 'none' | 'downloading' | 'paused' | 'completed' | 'failed';

export class EpisodeModel extends Model {
  static table = TableName.Episodes;

  static associations: Associations = {
    [TableName.Podcasts]: { type: 'belongs_to', key: 'podcast_id' },
  };

  @field('podcast_id') podcastId!: string;
  @text('guid') guid!: string;
  @text('title') title!: string;
  @text('description') description!: string;
  @text('audio_url') audioUrl!: string;
  @text('artwork_url') artworkUrl!: string;
  @field('duration') duration!: number;
  @field('published_at') publishedAt!: number;
  @field('playback_position') playbackPosition!: number;
  @field('is_completed') isCompleted!: boolean;
  @field('last_played_at') lastPlayedAt!: number | null;
  @text('download_status') downloadStatus!: EpisodeDownloadStatus;
  @field('download_progress') downloadProgress!: number;
  @field('local_file_path') localFilePath!: string | null;
  @field('file_size') fileSize!: number;
  @field('downloaded_bytes') downloadedBytes!: number;

  @immutableRelation(TableName.Podcasts, 'podcast_id') podcast!: Relation<PodcastModel>;
}
