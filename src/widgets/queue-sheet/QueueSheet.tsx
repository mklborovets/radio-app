import React from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PlayableTrack } from '@entities/player';
import { COLORS } from '@shared/ui';
import {
  QUEUE_ROW_HEIGHT,
  ROW_GAP,
  useQueueRowItem,
  useQueueSheet,
} from './model';

export interface QueueSheetProps {
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

interface QueueRowItemProps {
  item: PlayableTrack;
  index: number;
  isActive: boolean;
  isDragging: boolean;
  anyDragging: boolean;
  dragY: Animated.Value;
  hoverIndex: number | null;
  draggingIndex: number | null;
  onStartDrag: (index: number) => void;
  onMoveDrag: (dy: number) => void;
  onEndDrag: () => void;
  onSelectTrack: (track: PlayableTrack) => void;
  onRemoveTrack: (trackId: string) => void;
}

function QueueRowItem({
  item,
  index,
  isActive,
  isDragging,
  anyDragging,
  dragY,
  hoverIndex,
  draggingIndex,
  onStartDrag,
  onMoveDrag,
  onEndDrag,
  onSelectTrack,
  onRemoveTrack,
}: QueueRowItemProps): React.JSX.Element {
  const { currentTranslateY, panHandlers, sourceLabel } = useQueueRowItem({
    item,
    index,
    isDragging,
    draggingIndex,
    hoverIndex,
    dragY,
    onStartDrag,
    onMoveDrag,
    onEndDrag,
  });

  return (
    <Animated.View
      pointerEvents={anyDragging && !isDragging ? 'none' : 'auto'}
      style={[
        styles.row,
        isActive && styles.rowActive,
        isDragging && styles.rowDragging,
        {
          transform: [
            { translateY: currentTranslateY },
            { scale: isDragging ? 1.02 : 1 },
          ],
        },
      ]}>
      <View
        style={styles.dragHandle}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        {...panHandlers}>
        <Text style={[styles.dragHandleIcon, isDragging && styles.dragHandleIconDragging]}>
          :::
        </Text>
      </View>

      <TouchableOpacity
        style={styles.trackInfo}
        onPress={() => onSelectTrack(item)}
        activeOpacity={0.8}
        disabled={anyDragging}>
        <Text style={styles.trackTitle} numberOfLines={1}>
          {index + 1}. {item.title}
        </Text>
        <Text style={styles.trackSubtitle} numberOfLines={1}>
          {sourceLabel} • {item.subtitle}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.removeBtn}
        onPress={() => onRemoveTrack(item.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        disabled={anyDragging}>
        <Text style={styles.removeBtnText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function QueueSheet({
  onDragStart,
  onDragEnd,
}: QueueSheetProps = {}): React.JSX.Element {
  const {
    queue,
    activeTrackId,
    draggingIndex,
    hoverIndex,
    anyDragging,
    dragY,
    onSelectTrack,
    onRemoveTrack,
    onClearQueue,
    onStartDrag,
    onMoveDrag,
    onEndDrag,
  } = useQueueSheet({ onDragStart, onDragEnd });

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerTitleBox}>
          <Text style={styles.title}>Up Next Queue ({queue.length})</Text>
          <Text style={styles.hint}>Drag ::: to reorder</Text>
        </View>
        {queue.length > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={onClearQueue}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.clearBtnText}>CLEAR ALL</Text>
          </TouchableOpacity>
        )}
      </View>

      {queue.length === 0 ? (
        <Text style={styles.emptyText}>
          Queue is empty. Tap &quot;+ QUEUE&quot; on any radio station or podcast episode to build your playlist.
        </Text>
      ) : (
        queue.map((item, idx) => (
          <QueueRowItem
            key={item.id}
            item={item}
            index={idx}
            isActive={activeTrackId === item.id}
            isDragging={draggingIndex === idx}
            anyDragging={anyDragging}
            dragY={dragY}
            hoverIndex={hoverIndex}
            draggingIndex={draggingIndex}
            onStartDrag={onStartDrag}
            onMoveDrag={onMoveDrag}
            onEndDrag={onEndDrag}
            onSelectTrack={onSelectTrack}
            onRemoveTrack={onRemoveTrack}
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
  headerTitleBox: {
    flex: 1,
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
    lineHeight: 19,
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: 'rgba(244, 63, 94, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.35)',
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
    letterSpacing: 0.5,
  },
  row: {
    height: QUEUE_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 8,
    marginBottom: ROW_GAP,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowActive: {
    borderColor: COLORS.primary,
  },
  rowDragging: {
    zIndex: 9999,
    elevation: 20,
    borderColor: COLORS.primary,
    backgroundColor: '#1b2d4a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
  },
  dragHandle: {
    width: 32,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  dragHandleIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  dragHandleIconDragging: {
    color: COLORS.primary,
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
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(244, 63, 94, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.accent,
  },
});
