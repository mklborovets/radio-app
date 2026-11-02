import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PlayableTrack } from '@entities/player';
import { COLORS } from '@shared/ui';
import { QUEUE_ROW_HEIGHT, useQueueRowDrag, useQueueSheet } from './model';

interface QueueRowProps {
  track: PlayableTrack;
  index: number;
  totalCount: number;
  isActive: boolean;
  onSelect: (track: PlayableTrack) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
  onRemove: (trackId: string) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

function QueueRow({
  track,
  index,
  totalCount,
  isActive,
  onSelect,
  onMove,
  onRemove,
  onDragStart,
  onDragEnd,
}: QueueRowProps): React.JSX.Element {
  const {
    dragOffsetY,
    isDragging,
    canMoveUp,
    canMoveDown,
    panHandlers,
    onMoveUp,
    onMoveDown,
  } = useQueueRowDrag(index, totalCount, onMove, onDragStart, onDragEnd);

  return (
    <View
      style={[
        styles.row,
        isActive && styles.rowActive,
        isDragging && styles.rowDragging,
        isDragging && {
          transform: [{ translateY: dragOffsetY }],
        },
      ]}>
      <View
        style={styles.dragHandle}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        {...panHandlers}>
        <Text style={styles.dragHandleIcon}>:::</Text>
      </View>

      <TouchableOpacity
        style={styles.trackInfo}
        onPress={() => onSelect(track)}
        activeOpacity={0.8}>
        <Text style={styles.trackTitle} numberOfLines={1}>
          {index + 1}. {track.title}
        </Text>
        <Text style={styles.trackSubtitle} numberOfLines={1}>
          {track.sourceType === 'radio' ? 'RADIO' : 'EPISODE'} • {track.subtitle}
        </Text>
      </TouchableOpacity>

      <View style={styles.rowActions}>
        {canMoveUp && (
          <TouchableOpacity style={styles.stepBtn} onPress={onMoveUp}>
            <Text style={styles.stepBtnText}>UP</Text>
          </TouchableOpacity>
        )}
        {canMoveDown && (
          <TouchableOpacity style={styles.stepBtn} onPress={onMoveDown}>
            <Text style={styles.stepBtnText}>DN</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => onRemove(track.id)}>
          <Text style={styles.removeBtnText}>X</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export interface QueueSheetProps {
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function QueueSheet({
  onDragStart,
  onDragEnd,
}: QueueSheetProps = {}): React.JSX.Element {
  const {
    queue,
    activeTrackId,
    onSelectTrack,
    onMoveTrack,
    onRemoveTrack,
    onClearQueue,
  } = useQueueSheet();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerTitleBox}>
          <Text style={styles.title}>Up Next Queue ({queue.length})</Text>
          <Text style={styles.hint}>Drag ::: or use buttons to reorder</Text>
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
          <QueueRow
            key={item.id}
            track={item}
            index={idx}
            totalCount={queue.length}
            isActive={activeTrackId === item.id}
            onSelect={onSelectTrack}
            onMove={onMoveTrack}
            onRemove={onRemoveTrack}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
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
    lineHeight: 19,
  },
  row: {
    height: QUEUE_ROW_HEIGHT,
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
  rowDragging: {
    zIndex: 999,
    elevation: 8,
    borderColor: COLORS.primary,
    backgroundColor: '#1b263b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  dragHandle: {
    width: 44,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
    paddingHorizontal: 6,
  },
  dragHandleIcon: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
  },
  headerTitleBox: {
    flex: 1,
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
