import { Model } from '@nozbe/watermelondb';
import { field, text } from '@nozbe/watermelondb/decorators';
import { TableName } from '../schema';

export class StationFavoriteModel extends Model {
  static table = TableName.StationsFavorites;

  @text('station_uuid') stationUuid!: string;
  @text('name') name!: string;
  @text('stream_url') streamUrl!: string;
  @text('favicon_url') faviconUrl!: string;
  @text('country') country!: string;
  @text('country_code') countryCode!: string;
  @text('tags') tags!: string;
  @field('bitrate') bitrate!: number;
  @text('codec') codec!: string;
  @field('added_at') addedAt!: number;
}
