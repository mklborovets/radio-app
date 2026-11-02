import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { COLORS } from './theme';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error';

export interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Badge({
  text,
  variant = 'default',
  style,
  textStyle,
}: BadgeProps): React.JSX.Element {
  return (
    <View style={[styles.badge, styles[variant], style]}>
      <Text style={[styles.text, textStyles[variant], textStyle]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  default: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
  },
  primary: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  success: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  warning: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  error: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: 'rgba(244, 63, 94, 0.35)',
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

const textStyles = StyleSheet.create({
  default: {
    color: COLORS.textSecondary,
  },
  primary: {
    color: COLORS.primary,
  },
  success: {
    color: COLORS.success,
  },
  warning: {
    color: COLORS.warning,
  },
  error: {
    color: COLORS.accent,
  },
});

