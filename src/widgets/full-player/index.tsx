import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePlayerStore } from '@entities/player';
import { COLORS } from '@shared/ui';

export interface FullPlayerProps {
  onClose: () => void;
}

export function FullPlayer({ onClose }: FullPlayerProps): React.JSX.Element {
  const activeTrack = usePlayerStore((state) => state.activeTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>CLOSE</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Now Playing</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.body}>
        <Text style={styles.trackTitle}>
          {activeTrack ? activeTrack.title : 'No active track'}
        </Text>
        <Text style={styles.trackSubtitle}>
          {activeTrack ? activeTrack.subtitle : 'Select a radio station or podcast episode'}
        </Text>
        {activeTrack && (
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={() => setIsPlaying(!isPlaying)}>
            <Text style={styles.primaryActionText}>
              {isPlaying ? 'PAUSE' : 'PLAY'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: COLORS.surface,
  },
  closeButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSpacer: {
    width: 60,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  trackSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  primaryAction: {
    marginTop: 32,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.background,
  },
});
