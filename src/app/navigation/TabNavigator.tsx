import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { RadioCatalogPage } from '@pages/radio-catalog';
import { PodcastsFeedPage } from '@pages/podcasts-feed';
import { DownloadsPage } from '@pages/downloads';
import { MiniPlayer } from '@widgets/mini-player';
import { COLORS, SPACING } from '@shared/ui';
import { MainTab, useBottomFooter } from './model';

function CustomBottomFooter(props: BottomTabBarProps): React.JSX.Element {
  const { items, footerContainerStyle, onOpenFullPlayer } =
    useBottomFooter(props);

  return (
    <View style={styles.footerWrapper}>
      <MiniPlayer onOpenFullPlayer={onOpenFullPlayer} />
      <View style={[styles.tabBarContainer, footerContainerStyle]}>
        <View style={styles.tabBarInner}>
          {items.map(item => (
            <Pressable
              key={item.key}
              style={[
                styles.tabItem,
                item.isFocused ? styles.tabItemActive : null,
              ]}
              onPress={item.onPress}>
              <View style={styles.glyphBox}>
                {item.isRadio ? (
                  <View style={styles.radioBarsRow}>
                    <View
                      style={[
                        styles.radioBar,
                        styles.radioBarShort,
                        { backgroundColor: item.iconColor },
                      ]}
                    />
                    <View
                      style={[
                        styles.radioBar,
                        styles.radioBarTall,
                        { backgroundColor: item.iconColor },
                      ]}
                    />
                    <View
                      style={[
                        styles.radioBar,
                        styles.radioBarMedium,
                        { backgroundColor: item.iconColor },
                      ]}
                    />
                    <View
                      style={[
                        styles.radioBar,
                        styles.radioBarTall,
                        { backgroundColor: item.iconColor },
                      ]}
                    />
                  </View>
                ) : null}
                {item.isPodcast ? (
                  <View style={styles.podcastIconWrap}>
                    <View
                      style={[
                        styles.podcastOuterRing,
                        { borderColor: item.iconColor },
                      ]}>
                      <View
                        style={[
                          styles.podcastInnerDot,
                          { backgroundColor: item.iconColor },
                        ]}
                      />
                    </View>
                    <View
                      style={[
                        styles.podcastStand,
                        { backgroundColor: item.iconColor },
                      ]}
                    />
                  </View>
                ) : null}
                {item.isDownloads ? (
                  <View style={styles.downloadIconWrap}>
                    <View
                      style={[
                        styles.downloadShaft,
                        { backgroundColor: item.iconColor },
                      ]}
                    />
                    <View
                      style={[
                        styles.downloadTip,
                        { borderColor: item.iconColor },
                      ]}
                    />
                    <View
                      style={[
                        styles.downloadTray,
                        { borderColor: item.iconColor },
                      ]}
                    />
                  </View>
                ) : null}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  item.isFocused ? styles.tabLabelActive : null,
                ]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

function renderTabBar(props: BottomTabBarProps): React.JSX.Element {
  return <CustomBottomFooter {...props} />;
}

export function TabNavigator(): React.JSX.Element {
  return (
    <View style={styles.wrapper}>
      <MainTab.Navigator
        tabBar={renderTabBar}
        screenOptions={{
          headerShown: false,
        }}>
        <MainTab.Screen name="RadioCatalog" component={RadioCatalogPage} />
        <MainTab.Screen name="PodcastsFeed" component={PodcastsFeedPage} />
        <MainTab.Screen name="Downloads" component={DownloadsPage} />
      </MainTab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  footerWrapper: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  tabBarContainer: {
    backgroundColor: COLORS.surface,
    paddingTop: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  tabBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: SPACING.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 14,
    gap: 4,
  },
  tabItemActive: {
    backgroundColor: COLORS.surfaceElevated,
  },
  tabLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    color: COLORS.primary,
  },
  glyphBox: {
    width: 22,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 16,
  },
  radioBar: {
    width: 3,
    borderRadius: 1.5,
  },
  radioBarShort: {
    height: 7,
  },
  radioBarMedium: {
    height: 11,
  },
  radioBarTall: {
    height: 16,
  },
  podcastIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  podcastOuterRing: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podcastInnerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  podcastStand: {
    width: 6,
    height: 3,
    borderRadius: 1.5,
    marginTop: 2,
  },
  downloadIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadShaft: {
    width: 2.5,
    height: 9,
    borderRadius: 1,
  },
  downloadTip: {
    width: 7,
    height: 7,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    transform: [{ rotate: '45deg' }],
    marginTop: -5,
  },
  downloadTray: {
    width: 16,
    height: 5,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    marginTop: 2,
  },
});
