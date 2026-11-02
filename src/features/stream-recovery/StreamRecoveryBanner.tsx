import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Banner } from '@shared/ui';
import { useStreamRecoveryBanner } from './model';

export interface StreamRecoveryBannerProps {
  style?: StyleProp<ViewStyle>;
}

export function StreamRecoveryBanner({
  style,
}: StreamRecoveryBannerProps = {}): React.JSX.Element | null {
  const {
    visible,
    showReconnectBanner,
    showBatteryBanner,
    recoveryTitle,
    recoveryMeta,
    onRetryNow,
    onRequestBatteryExemption,
  } = useStreamRecoveryBanner();

  if (!visible) {
    return null;
  }

  return (
    <View style={[styles.wrapper, style]}>
      {showReconnectBanner && (
        <Banner
          title={recoveryTitle}
          message={recoveryMeta}
          variant="warning"
          actionLabel="RETRY NOW"
          onAction={onRetryNow}
        />
      )}

      {showBatteryBanner && (
        <Banner
          message="Unrestricted background battery access is recommended for stable radio streaming."
          variant="info"
          actionLabel="ALLOW"
          onAction={onRequestBatteryExemption}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
});
