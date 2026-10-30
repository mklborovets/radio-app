import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

export const COLORS = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceElevated: '#334155',
  primary: '#38BDF8',
  primaryDark: '#0284C7',
  accent: '#F43F5E',
  success: '#10B981',
  warning: '#F59E0B',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#334155',
} as const;

export function ScreenContainer({ children, style, ...rest }: ViewProps): React.JSX.Element {
  return (
    <View style={[styles.container, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
