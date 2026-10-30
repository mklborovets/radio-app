import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, ScreenContainer } from '@shared/ui';

export function DownloadsPage(): React.JSX.Element {
  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Offline Downloads</Text>
        <Text style={styles.subtitle}>Cached episodes and storage usage</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});
