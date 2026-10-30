import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseProvider, PlayerProvider } from './providers';
import { RootNavigator } from './navigation';
import { COLORS } from '@shared/ui';

export function AppRoot(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <DatabaseProvider>
        <PlayerProvider>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
          <RootNavigator />
        </PlayerProvider>
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}
