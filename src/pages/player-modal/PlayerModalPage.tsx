import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FullPlayer } from '@widgets/full-player';
import { RootStackParamList } from '@shared/config';
import { ScreenContainer } from '@shared/ui';

export type PlayerModalPageProps = NativeStackScreenProps<
  RootStackParamList,
  'PlayerModal'
>;

export function PlayerModalPage({
  navigation,
}: PlayerModalPageProps): React.JSX.Element {
  return (
    <ScreenContainer includeTopInset={false} includeBottomInset>
      <FullPlayer onClose={navigation.goBack} />
    </ScreenContainer>
  );
}

