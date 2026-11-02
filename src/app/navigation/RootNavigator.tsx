import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PodcastDetailsPage } from '@pages/podcast-details';
import { PlayerModalPage } from '@pages/player-modal';
import { COLORS } from '@shared/ui';
import { navigationTheme, RootStack } from './model';
import { TabNavigator } from './TabNavigator';

export function RootNavigator(): React.JSX.Element {
  return (
    <NavigationContainer theme={navigationTheme}>
      <RootStack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.surface },
          headerTintColor: COLORS.textPrimary,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: COLORS.background },
        }}>
        <RootStack.Screen
          name="MainTabs"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="PodcastDetails"
          component={PodcastDetailsPage}
          options={({ route }) => ({ title: route.params.title })}
        />
        <RootStack.Screen
          name="PlayerModal"
          component={PlayerModalPage}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
