import { create } from 'zustand';

export type PlayableSourceType = 'radio' | 'episode';

export interface PlayableTrack {
  id: string;
  title: string;
  subtitle: string;
  artworkUrl: string;
  streamOrFileUrl: string;
  sourceType: PlayableSourceType;
  duration: number;
  episodeId?: string;
  podcastId?: string;
}

export type PlaybackSpeed = 0.5 | 0.75 | 1.0 | 1.25 | 1.5 | 1.75 | 2.0;

export const PLAYBACK_SPEED_OPTIONS: readonly PlaybackSpeed[] = [
  0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0,
];

export interface PlayerState {
  activeTrack: PlayableTrack | null;
  isPlaying: boolean;
  isBuffering: boolean;
  wasPlayingBeforeInterruption: boolean;
  positionSeconds: number;
  durationSeconds: number;
  playbackSpeed: PlaybackSpeed;
  queue: PlayableTrack[];
  sleepTimerTargetTimestamp: number | null;
  setActiveTrack: (track: PlayableTrack | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setIsBuffering: (isBuffering: boolean) => void;
  setWasPlayingBeforeInterruption: (wasPlaying: boolean) => void;
  setProgress: (positionSeconds: number, durationSeconds: number) => void;
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
  setQueue: (queue: PlayableTrack[]) => void;
  setSleepTimerTargetTimestamp: (timestamp: number | null) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  activeTrack: null,
  isPlaying: false,
  isBuffering: false,
  wasPlayingBeforeInterruption: false,
  positionSeconds: 0,
  durationSeconds: 0,
  playbackSpeed: 1.0,
  queue: [],
  sleepTimerTargetTimestamp: null,
  setActiveTrack: (activeTrack) => set({ activeTrack }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setIsBuffering: (isBuffering) => set({ isBuffering }),
  setWasPlayingBeforeInterruption: (wasPlayingBeforeInterruption) =>
    set({ wasPlayingBeforeInterruption }),
  setProgress: (positionSeconds, durationSeconds) =>
    set({ positionSeconds, durationSeconds }),
  setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
  setQueue: (queue) => set({ queue }),
  setSleepTimerTargetTimestamp: (sleepTimerTargetTimestamp) =>
    set({ sleepTimerTargetTimestamp }),
}));

