import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { usePlayerStore } from '@entities/player';
import { COLORS } from '@shared/ui';

export function QueueSheet(): React.JSX.Element {
  const queue = usePlayerStore((state) => state.queue);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Playback Queue ({queue.length})</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});
