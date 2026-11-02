import { useCallback, useMemo, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  GestureResponderHandlers,
  PanResponder,
} from 'react-native';
import {
  clearPlaybackQueue,
  PlayableTrack,
  removeTrackFromPlaybackQueue,
  reorderPlaybackQueue,
  startPlayableTrack,
  usePlayerStore,
} from '@entities/player';

export const QUEUE_ROW_HEIGHT = 60;

export interface UseQueueRowDragResult {
  dragOffsetY: number;
  isDragging: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  panHandlers: GestureResponderHandlers;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function useQueueRowDrag(
  index: number,
  totalCount: number,
  onMove: (fromIndex: number, toIndex: number) => void,
  onDragStart?: () => void,
  onDragEnd?: () => void,
): UseQueueRowDragResult {
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startIndexRef = useRef(index);
  startIndexRef.current = index;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (
          _evt: GestureResponderEvent,
          gestureState,
        ) => Math.abs(gestureState.dy) > 6,
        onMoveShouldSetPanResponderCapture: (
          _evt: GestureResponderEvent,
          gestureState,
        ) => Math.abs(gestureState.dy) > 6,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          setIsDragging(true);
          setDragOffsetY(0);
          onDragStart?.();
        },
        onPanResponderMove: (_evt, gestureState) => {
          setDragOffsetY(gestureState.dy);
        },
        onPanResponderRelease: (_evt, gestureState) => {
          const dy = gestureState.dy;
          let indexShift = 0;
          if (dy > 20) {
            indexShift = Math.max(1, Math.round(dy / QUEUE_ROW_HEIGHT));
          } else if (dy < -20) {
            indexShift = Math.min(-1, Math.round(dy / QUEUE_ROW_HEIGHT));
          }
          const targetIndex = Math.max(
            0,
            Math.min(totalCount - 1, startIndexRef.current + indexShift),
          );
          setIsDragging(false);
          setDragOffsetY(0);
          onDragEnd?.();
          if (targetIndex !== startIndexRef.current) {
            onMove(startIndexRef.current, targetIndex);
          }
        },
        onPanResponderTerminate: () => {
          setIsDragging(false);
          setDragOffsetY(0);
          onDragEnd?.();
        },
      }),
    [onDragEnd, onDragStart, onMove, totalCount],
  );

  const onMoveUp = useCallback(() => {
    if (index > 0) {
      onMove(index, index - 1);
    }
  }, [index, onMove]);

  const onMoveDown = useCallback(() => {
    if (index < totalCount - 1) {
      onMove(index, index + 1);
    }
  }, [index, onMove, totalCount]);

  return {
    dragOffsetY,
    isDragging,
    canMoveUp: index > 0,
    canMoveDown: index < totalCount - 1,
    panHandlers: panResponder.panHandlers,
    onMoveUp,
    onMoveDown,
  };
}

export interface UseQueueSheetResult {
  queue: PlayableTrack[];
  activeTrackId: string | null;
  onSelectTrack: (track: PlayableTrack) => void;
  onMoveTrack: (fromIndex: number, toIndex: number) => void;
  onRemoveTrack: (trackId: string) => void;
  onClearQueue: () => void;
}

export function useQueueSheet(): UseQueueSheetResult {
  const queue = usePlayerStore((state) => state.queue);
  const activeTrack = usePlayerStore((state) => state.activeTrack);

  const onSelectTrack = useCallback((selected: PlayableTrack) => {
    startPlayableTrack(selected, 0).catch(() => {});
  }, []);

  const onMoveTrack = useCallback((fromIndex: number, toIndex: number) => {
    reorderPlaybackQueue(fromIndex, toIndex).catch(() => {});
  }, []);

  const onRemoveTrack = useCallback((trackId: string) => {
    removeTrackFromPlaybackQueue(trackId).catch(() => {});
  }, []);

  const onClearQueue = useCallback(() => {
    clearPlaybackQueue().catch(() => {});
  }, []);

  return {
    queue,
    activeTrackId: activeTrack?.id ?? null,
    onSelectTrack,
    onMoveTrack,
    onRemoveTrack,
    onClearQueue,
  };
}

