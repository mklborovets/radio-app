import { ENV_CONFIG } from '@shared/config';
import { fetchWithTimeout } from '@shared/api';
import {
  getFavoriteStationUuids,
  mapDtoToRadioStation,
  RadioBrowserStationDto,
  RadioStation,
  SearchStationsParams,
} from './model';

function isValidStationDto(value: unknown): value is RadioBrowserStationDto {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.stationuuid === 'string' &&
    typeof candidate.name === 'string' &&
    (typeof candidate.url_resolved === 'string' || typeof candidate.url === 'string')
  );
}

function buildSearchQuery(params: SearchStationsParams): string {
  const pairs: string[] = [
    'hidebroken=true',
    'order=clickcount',
    'reverse=true',
    `limit=${params.limit ?? 50}`,
    `offset=${params.offset ?? 0}`,
  ];

  if (params.name && params.name.trim().length > 0) {
    pairs.push(`name=${encodeURIComponent(params.name.trim())}`);
  }
  if (params.countrycode && params.countrycode.trim().length > 0) {
    pairs.push(`countrycode=${encodeURIComponent(params.countrycode.trim().toUpperCase())}`);
  }
  if (params.tag && params.tag.trim().length > 0) {
    pairs.push(`tag=${encodeURIComponent(params.tag.trim().toLowerCase())}`);
  }

  return pairs.join('&');
}

export async function fetchRadioStations(
  params: SearchStationsParams,
): Promise<RadioStation[]> {
  const queryString = buildSearchQuery(params);
  let lastError: Error | null = null;

  for (const baseUrl of ENV_CONFIG.radioBrowserFallbackMirrors) {
    const endpoint = `${baseUrl}/json/stations/search?${queryString}`;
    try {
      const response = await fetchWithTimeout(
        endpoint,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'User-Agent': 'RadioPodcastPlayer/1.0',
          },
        },
        10000,
      );

      if (!response.ok) {
        throw new Error(`Radio Browser API responded with status ${response.status}`);
      }

      const rawData: unknown = await response.json();
      if (!Array.isArray(rawData)) {
        throw new Error('Unexpected response payload format from Radio Browser API');
      }

      const favoriteUuids = await getFavoriteStationUuids();
      return rawData
        .filter(isValidStationDto)
        .map((dto) => mapDtoToRadioStation(dto, favoriteUuids))
        .filter((station) => station.streamUrl.length > 0);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Network request failed');
    }
  }

  throw lastError ?? new Error('Unable to reach any Radio Browser API mirror');
}
