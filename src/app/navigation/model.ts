import { useCallback, useMemo } from 'react';
import { ViewStyle } from 'react-native';
import { DarkTheme, Theme } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import {
  BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { MainTabParamList, RootStackParamList } from '@shared/config';
import { COLORS } from '@shared/ui';

export const RootStack = createNativeStackNavigator<RootStackParamList>();
export const MainTab = createBottomTabNavigator<MainTabParamList>();

export const navigationTheme: Theme = {
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

export interface TabBarItemViewModel {
  key: string;
  routeName: keyof MainTabParamList;
  label: string;
  isFocused: boolean;
  iconColor: string;
  isRadio: boolean;
  isPodcast: boolean;
  isDownloads: boolean;
  onPress: () => void;
}

export interface UseBottomFooterResult {
  items: TabBarItemViewModel[];
  footerContainerStyle: ViewStyle;
  onOpenFullPlayer: () => void;
}

const TAB_LABELS: Record<keyof MainTabParamList, string> = {
  RadioCatalog: 'Radio',
  PodcastsFeed: 'Podcasts',
  Downloads: 'Downloads',
};

export function useBottomFooter(
  tabBarProps: BottomTabBarProps,
): UseBottomFooterResult {
  const bottomInset = tabBarProps.insets.bottom;

  const onOpenFullPlayer = useCallback(() => {
    const parentNav =
      tabBarProps.navigation.getParent<
        NativeStackNavigationProp<RootStackParamList>
      >();
    if (parentNav) {
      parentNav.navigate('PlayerModal');
    } else {
      (tabBarProps.navigation as unknown as {
        navigate: (name: string) => void;
      }).navigate('PlayerModal');
    }
  }, [tabBarProps.navigation]);

  const footerContainerStyle = useMemo<ViewStyle>(
    () => ({
      paddingBottom: Math.max(bottomInset, 10),
    }),
    [bottomInset],
  );

  const items: TabBarItemViewModel[] = tabBarProps.state.routes.map(
    (route, index) => {
      const routeName = route.name as keyof MainTabParamList;
      const isFocused = tabBarProps.state.index === index;

      const onPress = () => {
        const event = tabBarProps.navigation.emit({
          type: 'tabPress',
          target: route.key,
          canPreventDefault: true,
        });

        if (!isFocused && !event.defaultPrevented) {
          tabBarProps.navigation.navigate(route.name);
        }
      };

      return {
        key: route.key,
        routeName,
        label: TAB_LABELS[routeName] ?? route.name,
        isFocused,
        iconColor: isFocused ? COLORS.primary : COLORS.textSecondary,
        isRadio: routeName === 'RadioCatalog',
        isPodcast: routeName === 'PodcastsFeed',
        isDownloads: routeName === 'Downloads',
        onPress,
      };
    },
  );

  return {
    items,
    footerContainerStyle,
    onOpenFullPlayer,
  };
}
