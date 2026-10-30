import { Q } from '@nozbe/watermelondb';
import { database, StationFavoriteModel, TableName } from '@shared/db';

export interface RadioBrowserStationDto {
  stationuuid: string;
  name: string;
  url_resolved: string;
  url: string;
  favicon: string;
  country: string;
  countrycode: string;
  tags: string;
  bitrate: number;
  codec: string;
}

export interface RadioStation {
  stationUuid: string;
  name: string;
  streamUrl: string;
  faviconUrl: string;
  country: string;
  countryCode: string;
  tags: string[];
  bitrate: number;
  codec: string;
  isFavorite: boolean;
}

export interface SearchStationsParams {
  name?: string;
  countrycode?: string;
  tag?: string;
  limit?: number;
  offset?: number;
}

export function mapDtoToRadioStation(
  dto: RadioBrowserStationDto,
  favoriteUuids: ReadonlySet<string>,
): RadioStation {
  const parsedTags = dto.tags
    ? dto.tags
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    : [];

  return {
    stationUuid: dto.stationuuid,
    name: dto.name.trim() || 'Unknown Station',
    streamUrl: (dto.url_resolved || dto.url || '').trim(),
    faviconUrl: (dto.favicon || '').trim(),
    country: (dto.country || '').trim(),
    countryCode: (dto.countrycode || '').trim().toUpperCase(),
    tags: parsedTags,
    bitrate: typeof dto.bitrate === 'number' ? dto.bitrate : 0,
    codec: (dto.codec || 'MP3').trim().toUpperCase(),
    isFavorite: favoriteUuids.has(dto.stationuuid),
  };
}

export function mapFavoriteModelToRadioStation(
  model: StationFavoriteModel,
): RadioStation {
  const parsedTags = model.tags
    ? model.tags
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    : [];

  return {
    stationUuid: model.stationUuid,
    name: model.name,
    streamUrl: model.streamUrl,
    faviconUrl: model.faviconUrl,
    country: model.country,
    countryCode: model.countryCode,
    tags: parsedTags,
    bitrate: model.bitrate,
    codec: model.codec,
    isFavorite: true,
  };
}

export async function getFavoriteStationUuids(): Promise<Set<string>> {
  const collection = database.get<StationFavoriteModel>(TableName.StationsFavorites);
  const favorites = await collection.query().fetch();
  return new Set(favorites.map((item) => item.stationUuid));
}

export async function getFavoriteStations(): Promise<RadioStation[]> {
  const collection = database.get<StationFavoriteModel>(TableName.StationsFavorites);
  const favorites = await collection.query(Q.sortBy('added_at', Q.desc)).fetch();
  return favorites.map(mapFavoriteModelToRadioStation);
}

export async function toggleFavoriteStationInDb(station: RadioStation): Promise<boolean> {
  const collection = database.get<StationFavoriteModel>(TableName.StationsFavorites);
  const existing = await collection
    .query(Q.where('station_uuid', station.stationUuid))
    .fetch();

  return database.write(async () => {
    if (existing.length > 0) {
      await Promise.all(existing.map((record) => record.destroyPermanently()));
      return false;
    }

    await collection.create((record) => {
      record.stationUuid = station.stationUuid;
      record.name = station.name;
      record.streamUrl = station.streamUrl;
      record.faviconUrl = station.faviconUrl;
      record.country = station.country;
      record.countryCode = station.countryCode;
      record.tags = station.tags.join(',');
      record.bitrate = station.bitrate;
      record.codec = station.codec;
      record.addedAt = Date.now();
    });
    return true;
  });
}
