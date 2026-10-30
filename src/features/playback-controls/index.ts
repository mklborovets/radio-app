export interface PlaybackControlActions {
  togglePlayPause: () => Promise<void>;
  seekBySeconds: (deltaSeconds: number) => Promise<void>;
  skipToNext: () => Promise<void>;
  skipToPrevious: () => Promise<void>;
}
