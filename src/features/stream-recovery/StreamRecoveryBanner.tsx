import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Banner } from '@shared/ui';
import { useStreamRecoveryBanner } from './model';

export function StreamRecoveryBanner(): React.JSX.Element | null {
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
    <View style={styles.wrapper}>
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
