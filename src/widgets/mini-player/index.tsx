import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePlayerStore } from '@entities/player';
import { COLORS } from '@shared/ui';

export interface MiniPlayerProps {
  onOpenFullPlayer: () => void;
}

export function MiniPlayer({ onOpenFullPlayer }: MiniPlayerProps): React.JSX.Element | null {
  const activeTrack = usePlayerStore((state) => state.activeTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);

  if (!activeTrack) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.9}
      onPress={onOpenFullPlayer}>
      <View style={styles.infoColumn}>
        <Text style={styles.title} numberOfLines={1}>
          {activeTrack.title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {activeTrack.subtitle}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.playButton}
        onPress={() => setIsPlaying(!isPlaying)}>
        <Text style={styles.playButtonText}>{isPlaying ? 'PAUSE' : 'PLAY'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  infoColumn: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  playButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  playButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.background,
  },
});
