import React from 'react';
import {
  Insets,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { COLORS } from './theme';

export interface MoreOptionsButtonProps {
  onPress: () => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  hitSlop?: Insets;
  accessibilityLabel?: string;
}

export function MoreOptionsButton({
  onPress,
  size = 38,
  style,
  textStyle,
  hitSlop = { top: 8, bottom: 8, left: 6, right: 8 },
  accessibilityLabel = 'More options',
}: MoreOptionsButtonProps): React.JSX.Element {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
      onPress={onPress}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}>
      <Text style={[styles.text, textStyle]}>•••</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  text: {
    fontSize: 13,
    color: COLORS.textSecondary,
    letterSpacing: -1,
  },
});

