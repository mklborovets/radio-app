import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { COLORS } from './theme';

export interface EmptyStateProps {
  message: string;
  title?: string;
  iconText?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  message,
  title,
  iconText,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps): React.JSX.Element {
  return (
    <View style={[styles.container, style]}>
      {Boolean(iconText) && (
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>{iconText}</Text>
        </View>
      )}

      {Boolean(title) && <Text style={styles.title}>{title}</Text>}

      <Text style={styles.message}>{message}</Text>

      {Boolean(actionLabel && onAction) && (
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onAction}
          activeOpacity={0.8}>
          <Text style={styles.actionBtnText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconText: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.primary,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  actionBtn: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.background,
    letterSpacing: 0.5,
  },
});

