import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
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
  dragOffsetY: Animated.Value;
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
  const dragOffsetY = useRef(new Animated.Value(0)).current;
  const [isDragging, setIsDragging] = useState(false);
  const startIndexRef = useRef(index);
  startIndexRef.current = index;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (_evt, gestureState) =>
          Math.abs(gestureState.dy) > 4,
        onMoveShouldSetPanResponderCapture: (_evt, gestureState) =>
          Math.abs(gestureState.dy) > 4,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          dragOffsetY.setValue(0);
          setIsDragging(true);
          onDragStart?.();
        },
        onPanResponderMove: Animated.event([null, { dy: dragOffsetY }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_evt, gestureState) => {
          const dy = gestureState.dy;
          const indexShift = Math.round(dy / QUEUE_ROW_HEIGHT);
          const targetIndex = Math.max(
            0,
            Math.min(totalCount - 1, startIndexRef.current + indexShift),
          );
          Animated.spring(dragOffsetY, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
          setIsDragging(false);
          onDragEnd?.();
          if (targetIndex !== startIndexRef.current) {
            onMove(startIndexRef.current, targetIndex);
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(dragOffsetY, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
          setIsDragging(false);
          onDragEnd?.();
        },
      }),
    [dragOffsetY, onDragEnd, onDragStart, onMove, totalCount],
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

