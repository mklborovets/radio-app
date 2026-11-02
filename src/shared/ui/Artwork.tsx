import React, { useState } from 'react';
import {
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { getInitials, isValidMediaUrl } from '@shared/lib';
import { COLORS } from './theme';

export interface ArtworkProps {
  uri?: string | null;
  title?: string;
  fallbackText?: string;
  size?: number;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  fallbackTextStyle?: StyleProp<TextStyle>;
}

export function Artwork({
  uri,
  title,
  fallbackText,
  size,
  width,
  height,
  borderRadius = 10,
  resizeMode = 'cover',
  style,
  imageStyle,
  fallbackTextStyle,
}: ArtworkProps): React.JSX.Element {
  const [hasLoadError, setHasLoadError] = useState(false);

  const resolvedWidth = width ?? size ?? 52;
  const resolvedHeight = height ?? size ?? 52;
  const displayFallback = fallbackText ?? (title ? getInitials(title) : '');

  const hasValidUri = Boolean(uri) && isValidMediaUrl(uri) && !hasLoadError;

  const dynamicContainerStyle: ViewStyle = {
    width: resolvedWidth as any,
    height: resolvedHeight as any,
    borderRadius,
  };

  const calculatedFontSize = typeof resolvedWidth === 'number'
    ? Math.max(11, Math.round(resolvedWidth * 0.28))
    : 15;

  return (
    <View style={[styles.container, dynamicContainerStyle, style]}>
      {hasValidUri ? (
        <Image
          source={{ uri: uri! }}
          style={[styles.image, imageStyle]}
          resizeMode={resizeMode}
          onError={() => setHasLoadError(true)}
        />
      ) : (
        <View style={styles.fallbackBox}>
          <Text
            style={[
              styles.fallbackText,
              { fontSize: calculatedFontSize },
              fallbackTextStyle,
            ]}
            numberOfLines={1}>
            {displayFallback}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceElevated,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallbackBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontWeight: '700',
    color: COLORS.primary,
  },
});

