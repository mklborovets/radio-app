import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StationList } from '@widgets/station-list';
import { COLORS, ScreenContainer } from '@shared/ui';

export function RadioCatalogPage(): React.JSX.Element {
  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Radio Stations</Text>
      </View>
      <StationList stations={[]} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});
