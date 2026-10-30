import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@shared/config';
import { COLORS, ScreenContainer } from '@shared/ui';

export type PodcastDetailsPageProps = NativeStackScreenProps<
  RootStackParamList,
  'PodcastDetails'
>;

export function PodcastDetailsPage({ route }: PodcastDetailsPageProps): React.JSX.Element {
  const { podcastId, title } = route.params;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Podcast ID: {podcastId}</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});
