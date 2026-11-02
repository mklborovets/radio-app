import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
export const ROW_GAP = 8;
export const ROW_TOTAL_HEIGHT = QUEUE_ROW_HEIGHT + ROW_GAP;

export interface UseQueueSheetProps {
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export interface UseQueueSheetResult {
  queue: PlayableTrack[];
  activeTrackId: string | null;
  draggingIndex: number | null;
  hoverIndex: number | null;
  anyDragging: boolean;
  dragY: Animated.Value;
  onSelectTrack: (track: PlayableTrack) => void;
  onRemoveTrack: (trackId: string) => void;
  onClearQueue: () => void;
  onStartDrag: (index: number) => void;
  onMoveDrag: (dy: number) => void;
  onEndDrag: () => void;
}

export function useQueueSheet({
  onDragStart,
  onDragEnd,
}: UseQueueSheetProps = {}): UseQueueSheetResult {
  const queue = usePlayerStore((state) => state.queue);
  const activeTrack = usePlayerStore((state) => state.activeTrack);

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const dragY = useRef(new Animated.Value(0)).current;
  const startIndexRef = useRef<number | null>(null);
  const hoverIndexRef = useRef<number | null>(null);
  const queueLengthRef = useRef(queue.length);
  queueLengthRef.current = queue.length;

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

  const onStartDrag = useCallback(
    (index: number) => {
      startIndexRef.current = index;
      hoverIndexRef.current = index;
      dragY.setValue(0);
      setDraggingIndex(index);
      setHoverIndex(index);
      onDragStart?.();
    },
    [dragY, onDragStart],
  );

  const onMoveDrag = useCallback(
    (dy: number) => {
      dragY.setValue(dy);
      const start = startIndexRef.current;
      if (start === null) {
        return;
      }
      const shift = Math.round(dy / ROW_TOTAL_HEIGHT);
      const target = Math.max(
        0,
        Math.min(queueLengthRef.current - 1, start + shift),
      );
      if (target !== hoverIndexRef.current) {
        hoverIndexRef.current = target;
        setHoverIndex(target);
      }
    },
    [dragY],
  );

  const onEndDrag = useCallback(() => {
    const from = startIndexRef.current;
    const to = hoverIndexRef.current;
    startIndexRef.current = null;
    hoverIndexRef.current = null;
    dragY.setValue(0);
    setDraggingIndex(null);
    setHoverIndex(null);
    onDragEnd?.();
    if (from !== null && to !== null && from !== to) {
      onMoveTrack(from, to);
    }
  }, [dragY, onDragEnd, onMoveTrack]);

  return {
    queue,
    activeTrackId: activeTrack?.id ?? null,
    draggingIndex,
    hoverIndex,
    anyDragging: draggingIndex !== null,
    dragY,
    onSelectTrack,
    onRemoveTrack,
    onClearQueue,
    onStartDrag,
    onMoveDrag,
    onEndDrag,
  };
}

export interface UseQueueRowItemProps {
  item: PlayableTrack;
  index: number;
  isDragging: boolean;
  draggingIndex: number | null;
  hoverIndex: number | null;
  dragY: Animated.Value;
  onStartDrag: (index: number) => void;
  onMoveDrag: (dy: number) => void;
  onEndDrag: () => void;
}

export interface UseQueueRowItemResult {
  currentTranslateY: Animated.Value;
  panHandlers: GestureResponderHandlers;
  sourceLabel: string;
}

export function useQueueRowItem({
  item,
  index,
  isDragging,
  draggingIndex,
  hoverIndex,
  dragY,
  onStartDrag,
  onMoveDrag,
  onEndDrag,
}: UseQueueRowItemProps): UseQueueRowItemResult {
  const offsetY = useRef(new Animated.Value(0)).current;
  const indexRef = useRef(index);
  indexRef.current = index;

  const onStartDragRef = useRef(onStartDrag);
  onStartDragRef.current = onStartDrag;
  const onMoveDragRef = useRef(onMoveDrag);
  onMoveDragRef.current = onMoveDrag;
  const onEndDragRef = useRef(onEndDrag);
  onEndDragRef.current = onEndDrag;

  useEffect(() => {
    if (draggingIndex === null || isDragging) {
      offsetY.setValue(0);
      return;
    }

    let targetOffset = 0;
    if (hoverIndex !== null) {
      if (draggingIndex < hoverIndex && index > draggingIndex && index <= hoverIndex) {
        targetOffset = -ROW_TOTAL_HEIGHT;
      } else if (draggingIndex > hoverIndex && index < draggingIndex && index >= hoverIndex) {
        targetOffset = ROW_TOTAL_HEIGHT;
      }
    }

    Animated.spring(offsetY, {
      toValue: targetOffset,
      useNativeDriver: true,
      friction: 9,
      tension: 120,
    }).start();
  }, [draggingIndex, hoverIndex, index, isDragging, offsetY]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: (_evt, gs) => Math.abs(gs.dy) > 2,
        onMoveShouldSetPanResponderCapture: (_evt, gs) => Math.abs(gs.dy) > 2,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: () => {
          onStartDragRef.current(indexRef.current);
        },
        onPanResponderMove: (_evt, gs) => {
          onMoveDragRef.current(gs.dy);
        },
        onPanResponderRelease: () => {
          onEndDragRef.current();
        },
        onPanResponderTerminate: () => {
          onEndDragRef.current();
        },
      }),
    [],
  );

  const sourceLabel =
    item.sourceType === 'radio'
      ? 'RADIO'
      : item.isAutoGenerated
      ? 'UP NEXT'
      : 'QUEUED';

  const currentTranslateY = isDragging ? dragY : offsetY;

  return {
    currentTranslateY,
    panHandlers: panResponder.panHandlers,
    sourceLabel,
  };
}
