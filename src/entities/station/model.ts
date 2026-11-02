import { Q } from '@nozbe/watermelondb';
import { database, StationFavoriteModel, TableName } from '@shared/db';
import { getInitials, sanitizeImageUrl } from '@shared/lib';

export { sanitizeImageUrl };

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
  lastcheckok?: number;
}

export interface RadioStation {
  stationUuid: string;
  name: string;
  streamUrl: string;
  fallbackStreamUrl: string;
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

  const resolved = (dto.url_resolved || '').trim();
  const original = (dto.url || '').trim();
  let primaryUrl = resolved || original;
  let fallbackUrl = original && original !== primaryUrl ? original : '';
  if (resolved.includes('tvstitch.com') && original && !original.includes('tvstitch.com')) {
    primaryUrl = original;
    fallbackUrl = resolved;
  }

  return {
    stationUuid: dto.stationuuid,
    name: dto.name.trim() || 'Unknown Station',
    streamUrl: primaryUrl,
    fallbackStreamUrl: fallbackUrl,
    faviconUrl: sanitizeImageUrl(dto.favicon),
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
    fallbackStreamUrl: '',
    faviconUrl: sanitizeImageUrl(model.faviconUrl),
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

export interface StationCardViewModel {
  initials: string;
  metadataText: string;
  tagsText: string | null;
  favoriteLabel: string;
  queueLabel: string;
  playBadgeLabel: string;
  isLivePlaying: boolean;
  isConnecting: boolean;
}

export function getStationCardViewModel(
  station: RadioStation,
  isCurrentStation: boolean,
  isPlaying: boolean,
  isBuffering: boolean,
  isQueued: boolean,
): StationCardViewModel {
  const metadataParts: string[] = [];
  if (station.countryCode) {
    metadataParts.push(station.countryCode);
  }
  if (station.codec) {
    metadataParts.push(station.codec);
  }
  if (station.bitrate > 0) {
    metadataParts.push(`${station.bitrate} kbps`);
  }

  const isConnecting = isCurrentStation && isBuffering;
  const isLivePlaying = isCurrentStation && isPlaying && !isBuffering;

  let playBadgeLabel = 'PLAY';
  if (isConnecting) {
    playBadgeLabel = 'WAIT...';
  } else if (isLivePlaying) {
    playBadgeLabel = 'PAUSE';
  }

  return {
    initials: getInitials(station.name),
    metadataText: metadataParts.join(' • ') || 'Live Radio Stream',
    tagsText: station.tags.length > 0 ? station.tags.slice(0, 3).join(' · ') : null,
    favoriteLabel: station.isFavorite ? 'SAVED' : 'SAVE',
    queueLabel: isQueued ? 'QUEUED' : '+ QUEUE',
    playBadgeLabel,
    isLivePlaying,
    isConnecting,
  };
}
