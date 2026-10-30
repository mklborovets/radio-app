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
