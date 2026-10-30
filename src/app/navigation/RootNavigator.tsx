import React from 'react';
import { DarkTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PodcastDetailsPage } from '@pages/podcast-details';
import { PlayerModalPage } from '@pages/player-modal';
import { RootStackParamList } from '@shared/config';
import { COLORS } from '@shared/ui';
import { TabNavigator } from './TabNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: COLORS.primary,
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.textPrimary,
    border: COLORS.border,
    notification: COLORS.accent,
  },
};

export function RootNavigator(): React.JSX.Element {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.surface },
          headerTintColor: COLORS.textPrimary,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: COLORS.background },
        }}>
        <Stack.Screen
          name="MainTabs"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PodcastDetails"
          component={PodcastDetailsPage}
          options={({ route }) => ({ title: route.params.title })}
        />
        <Stack.Screen
          name="PlayerModal"
          component={PlayerModalPage}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
