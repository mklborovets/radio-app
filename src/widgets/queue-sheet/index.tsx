import React, { useMemo, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  PlayableTrack,
  removeTrackFromPlaybackQueue,
  reorderPlaybackQueue,
  startPlayableTrack,
  usePlayerStore,
} from '@entities/player';
import { COLORS } from '@shared/ui';

const ROW_HEIGHT = 60;

interface QueueRowProps {
  track: PlayableTrack;
  index: number;
  totalCount: number;
  isActive: boolean;
  onSelect: (track: PlayableTrack) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
  onRemove: (trackId: string) => void;
}

function QueueRow({
  track,
  index,
  totalCount,
  isActive,
  onSelect,
  onMove,
  onRemove,
}: QueueRowProps): React.JSX.Element {
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startIndexRef = useRef(index);
  startIndexRef.current = index;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (
          _evt: GestureResponderEvent,
          gestureState,
        ) => Math.abs(gestureState.dy) > 4,
        onPanResponderGrant: () => {
          setIsDragging(true);
          setDragOffsetY(0);
        },
        onPanResponderMove: (_evt, gestureState) => {
          setDragOffsetY(gestureState.dy);
        },
        onPanResponderRelease: (_evt, gestureState) => {
          const indexShift = Math.round(gestureState.dy / ROW_HEIGHT);
          const targetIndex = Math.max(
            0,
            Math.min(totalCount - 1, startIndexRef.current + indexShift),
          );
          setIsDragging(false);
          setDragOffsetY(0);
          if (targetIndex !== startIndexRef.current) {
            onMove(startIndexRef.current, targetIndex);
          }
        },
        onPanResponderTerminate: () => {
          setIsDragging(false);
          setDragOffsetY(0);
        },
      }),
    [onMove, totalCount],
  );

  return (
    <View
      style={[
        styles.row,
        isActive && styles.rowActive,
        isDragging && {
          transform: [{ translateY: dragOffsetY }],
          zIndex: 10,
          borderColor: COLORS.primary,
        },
      ]}>
      <View style={styles.dragHandle} {...panResponder.panHandlers}>
        <Text style={styles.dragHandleIcon}>≡</Text>
      </View>

      <TouchableOpacity
        style={styles.trackInfo}
        onPress={() => onSelect(track)}
        activeOpacity={0.8}>
        <Text style={styles.trackTitle} numberOfLines={1}>
          {index + 1}. {track.title}
        </Text>
        <Text style={styles.trackSubtitle} numberOfLines={1}>
          {track.subtitle}
        </Text>
      </TouchableOpacity>

      <View style={styles.rowActions}>
        {index > 0 && (
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => onMove(index, index - 1)}>
            <Text style={styles.stepBtnText}>↑</Text>
          </TouchableOpacity>
        )}
        {index < totalCount - 1 && (
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => onMove(index, index + 1)}>
            <Text style={styles.stepBtnText}>↓</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => onRemove(track.id)}>
          <Text style={styles.removeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function QueueSheet(): React.JSX.Element {
  const queue = usePlayerStore((state) => state.queue);
  const activeTrack = usePlayerStore((state) => state.activeTrack);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Up Next Queue ({queue.length})</Text>
        <Text style={styles.hint}>Drag handle ≡ or arrows to reorder</Text>
      </View>

      {queue.length === 0 ? (
        <Text style={styles.emptyText}>Queue is empty.</Text>
      ) : (
        queue.map((item, idx) => (
          <QueueRow
            key={item.id}
            track={item}
            index={idx}
            totalCount={queue.length}
            isActive={activeTrack?.id === item.id}
            onSelect={(selected) => {
              startPlayableTrack(selected, 0).catch(() => {});
            }}
            onMove={(from, to) => {
              reorderPlaybackQueue(from, to).catch(() => {});
            }}
            onRemove={(trackId) => {
              removeTrackFromPlaybackQueue(trackId).catch(() => {});
            }}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  hint: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    paddingVertical: 12,
  },
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 8,
    marginBottom: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowActive: {
    borderColor: COLORS.primary,
  },
  dragHandle: {
    width: 32,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  dragHandleIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  trackInfo: {
    flex: 1,
    marginRight: 8,
  },
  trackTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  trackSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepBtn: {
    width: 26,
    height: 26,
    borderRadius: 4,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  removeBtn: {
    width: 26,
    height: 26,
    borderRadius: 4,
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
  },
});
