import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RadioCatalogPage } from '@pages/radio-catalog';
import { PodcastsFeedPage } from '@pages/podcasts-feed';
import { DownloadsPage } from '@pages/downloads';
import { MiniPlayer } from '@widgets/mini-player';
import { MainTabParamList, RootStackParamList } from '@shared/config';
import { COLORS } from '@shared/ui';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function TabNavigator(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.wrapper}>
      <View style={styles.tabsArea}>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.textSecondary,
            tabBarLabelStyle: styles.tabBarLabel,
          }}>
          <Tab.Screen
            name="RadioCatalog"
            component={RadioCatalogPage}
            options={{ title: 'Radio' }}
          />
          <Tab.Screen
            name="PodcastsFeed"
            component={PodcastsFeedPage}
            options={{ title: 'Podcasts' }}
          />
          <Tab.Screen
            name="Downloads"
            component={DownloadsPage}
            options={{ title: 'Downloads' }}
          />
        </Tab.Navigator>
      </View>
      <MiniPlayer onOpenFullPlayer={() => navigation.navigate('PlayerModal')} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabsArea: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopColor: COLORS.border,
    height: 60,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});

