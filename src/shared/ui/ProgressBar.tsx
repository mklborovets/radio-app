import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { COLORS } from './theme';

export interface ProgressBarProps {
  progress: number;
  height?: number;
  trackColor?: string;
  fillColor?: string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  fillStyle?: StyleProp<ViewStyle>;
}

export function ProgressBar({
  progress,
  height = 4,
  trackColor = COLORS.surfaceElevated,
  fillColor = COLORS.primary,
  borderRadius = 2,
  style,
  fillStyle,
}: ProgressBarProps): React.JSX.Element {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(progress) ? progress : 0));

  return (
    <View
      style={[
        styles.track,
        {
          height,
          backgroundColor: trackColor,
          borderRadius,
        },
        style,
      ]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clamped}%`,
            backgroundColor: fillColor,
          },
          fillStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});

