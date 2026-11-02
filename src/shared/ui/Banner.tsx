import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { COLORS } from './theme';

export type BannerVariant = 'info' | 'warning' | 'error' | 'success';

export interface BannerProps {
  message: string;
  title?: string;
  variant?: BannerVariant;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  dismissLabel?: string;
  style?: StyleProp<ViewStyle>;
  messageStyle?: StyleProp<TextStyle>;
}

export function Banner({
  message,
  title,
  variant = 'info',
  actionLabel,
  onAction,
  onDismiss,
  dismissLabel = 'DISMISS',
  style,
  messageStyle,
}: BannerProps): React.JSX.Element {
  return (
    <View style={[styles.banner, styles[variant], style]}>
      <View style={styles.textColumn}>
        {Boolean(title) && (
          <Text style={[styles.title, titleStyles[variant]]}>{title}</Text>
        )}
        <Text style={[styles.message, textStyles[variant], messageStyle]}>
          {message}
        </Text>
      </View>

      <View style={styles.actionRow}>
        {Boolean(actionLabel && onAction) && (
          <TouchableOpacity
            style={[styles.actionBtn, btnStyles[variant]]}
            onPress={onAction}>
            <Text style={[styles.actionBtnText, btnTextStyles[variant]]}>
              {actionLabel}
            </Text>
          </TouchableOpacity>
        )}

        {Boolean(onDismiss) && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.dismissBtn]}
            onPress={onDismiss}>
            <Text style={styles.dismissBtnText}>{dismissLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  textColumn: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  actionBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dismissBtn: {
    backgroundColor: COLORS.surfaceElevated,
  },
  dismissBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  info: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  warning: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderColor: COLORS.warning,
  },
  error: {
    backgroundColor: '#1E293B',
    borderColor: COLORS.accent,
  },
  success: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderColor: COLORS.success,
  },
});

const titleStyles = StyleSheet.create({
  info: {
    color: COLORS.primary,
  },
  warning: {
    color: COLORS.warning,
  },
  error: {
    color: COLORS.accent,
  },
  success: {
    color: COLORS.success,
  },
});

const textStyles = StyleSheet.create({
  info: {
    color: COLORS.textSecondary,
  },
  warning: {
    color: COLORS.textSecondary,
  },
  error: {
    color: '#FDA4AF',
  },
  success: {
    color: COLORS.textPrimary,
  },
});

const btnStyles = StyleSheet.create({
  info: {
    backgroundColor: COLORS.primary,
  },
  warning: {
    backgroundColor: COLORS.warning,
  },
  error: {
    backgroundColor: COLORS.accent,
  },
  success: {
    backgroundColor: COLORS.success,
  },
});

const btnTextStyles = StyleSheet.create({
  info: {
    color: COLORS.background,
  },
  warning: {
    color: COLORS.background,
  },
  error: {
    color: COLORS.textPrimary,
  },
  success: {
    color: COLORS.background,
  },
});

