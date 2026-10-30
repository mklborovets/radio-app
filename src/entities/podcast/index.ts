export interface PodcastEntity {
  id: string;
  feedUrl: string;
  title: string;
  author: string;
  description: string;
  artworkUrl: string;
  etag: string | null;
  lastModified: string | null;
  subscribedAt: number;
  updatedAt: number;
}
