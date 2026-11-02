import React from 'react';
import {
  ActivityIndicator,
  Insets,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { COLORS } from './theme';

export interface PlayPauseButtonProps {
  isPlaying: boolean;
  isLoading?: boolean;
  size?: 'small' | 'medium' | 'large' | number;
  variant?: 'default' | 'active' | 'connecting' | 'primary';
  onPress: () => void;
  activeOpacity?: number;
  hitSlop?: Insets;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function PlayPauseButton({
  isPlaying,
  isLoading = false,
  size = 'small',
  variant,
  onPress,
  activeOpacity = 0.85,
  hitSlop = { top: 8, bottom: 8, left: 6, right: 6 },
  style,
  accessibilityLabel,
}: PlayPauseButtonProps): React.JSX.Element {
  let dimension = 38;
  if (typeof size === 'number') {
    dimension = size;
  } else if (size === 'medium') {
    dimension = 48;
  } else if (size === 'large') {
    dimension = 64;
  }

  const isPrimary = variant === 'primary';
  const isActive = variant === 'active' || (variant === undefined && isPlaying);
  const isConnecting = variant === 'connecting';

  const pauseBarWidth = Math.max(3, Math.round(dimension * 0.085));
  const pauseBarHeight = Math.max(12, Math.round(dimension * 0.35));
  const pauseBarGap = Math.max(3, Math.round(dimension * 0.08));
  const playIconFontSize = Math.max(13, Math.round(dimension * 0.36));

  const barColor = isPrimary || isActive ? COLORS.background : COLORS.textPrimary;
  const triangleColor = isPrimary || isActive ? COLORS.background : COLORS.textPrimary;
  const spinnerColor = isPrimary || isActive || isConnecting ? COLORS.background : COLORS.primary;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
        },
        isActive && styles.active,
        isConnecting && styles.connecting,
        isPrimary && styles.primary,
        style,
      ]}
      onPress={onPress}
      activeOpacity={activeOpacity}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (isPlaying ? 'Pause' : 'Play')}>
      {isLoading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : isPlaying ? (
        <View style={[styles.pauseBars, { gap: pauseBarGap }]}>
          <View
            style={[
              styles.pauseBar,
              {
                width: pauseBarWidth,
                height: pauseBarHeight,
                backgroundColor: barColor,
              },
            ]}
          />
          <View
            style={[
              styles.pauseBar,
              {
                width: pauseBarWidth,
                height: pauseBarHeight,
                backgroundColor: barColor,
              },
            ]}
          />
        </View>
      ) : (
        <Text
          style={[
            styles.playTriangle,
            {
              fontSize: playIconFontSize,
              color: triangleColor,
              marginLeft: Math.max(2, Math.round(dimension * 0.05)),
            },
          ]}>
          ▶
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  active: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  connecting: {
    backgroundColor: COLORS.warning,
    borderColor: COLORS.warning,
  },
  primary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pauseBars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pauseBar: {
    borderRadius: 2,
  },
  playTriangle: {
    fontWeight: '800',
  },
});

