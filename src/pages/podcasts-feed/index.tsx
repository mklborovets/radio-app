import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, ScreenContainer } from '@shared/ui';

export function PodcastsFeedPage(): React.JSX.Element {
  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Podcasts</Text>
        <Text style={styles.subtitle}>Subscribe via RSS feed URL</Text>
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
