import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useScreenContainerStyle } from './model';
import { COLORS } from './theme';

export interface ScreenContainerProps extends ViewProps {
  includeTopInset?: boolean;
  includeBottomInset?: boolean;
}

export function ScreenContainer({
  children,
  style,
  includeTopInset = true,
  includeBottomInset = false,
  ...rest
}: ScreenContainerProps): React.JSX.Element {
  const { safePaddingStyle } = useScreenContainerStyle(
    includeTopInset,
    includeBottomInset,
  );

  return (
    <View style={[styles.container, safePaddingStyle, style]} {...rest}>
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
