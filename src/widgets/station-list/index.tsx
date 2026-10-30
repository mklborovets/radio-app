import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RadioStation } from '@entities/station';
import { COLORS } from '@shared/ui';

export interface StationListProps {
  stations: RadioStation[];
}

export function StationList({ stations }: StationListProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.infoText}>Stations loaded: {stations.length}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
