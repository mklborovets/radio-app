import { ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface UseScreenContainerStyleResult {
  safePaddingStyle: ViewStyle;
}

export function useScreenContainerStyle(
  includeTopInset = true,
  includeBottomInset = false,
): UseScreenContainerStyleResult {
  const insets = useSafeAreaInsets();

  return {
    safePaddingStyle: {
      paddingTop: includeTopInset ? insets.top : 0,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: includeBottomInset ? insets.bottom : 0,
    },
  };
}
