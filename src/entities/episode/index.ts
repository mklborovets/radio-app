import { EpisodeDownloadStatus } from '@shared/db';

export interface EpisodeEntity {
  id: string;
  podcastId: string;
  guid: string;
  title: string;
  description: string;
  audioUrl: string;
  artworkUrl: string;
  duration: number;
  publishedAt: number;
  playbackPosition: number;
  isCompleted: boolean;
  lastPlayedAt: number | null;
  downloadStatus: EpisodeDownloadStatus;
  downloadProgress: number;
  localFilePath: string | null;
  fileSize: number;
  downloadedBytes: number;
}
