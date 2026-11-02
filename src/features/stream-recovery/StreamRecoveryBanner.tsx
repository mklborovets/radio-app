import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '@shared/ui';
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
        <View style={styles.recoveryCard}>
          <View style={styles.recoveryTextCol}>
            <Text style={styles.recoveryTitle}>{recoveryTitle}</Text>
            <Text style={styles.recoveryMeta}>{recoveryMeta}</Text>
          </View>
          <TouchableOpacity style={styles.retryBtn} onPress={onRetryNow}>
            <Text style={styles.retryBtnText}>RETRY NOW</Text>
          </TouchableOpacity>
        </View>
      )}

      {showBatteryBanner && (
        <View style={styles.batteryCard}>
          <Text style={styles.batteryText}>
            Unrestricted background battery access is recommended for stable radio streaming.
          </Text>
          <TouchableOpacity
            style={styles.batteryBtn}
            onPress={onRequestBatteryExemption}>
            <Text style={styles.batteryBtnText}>ALLOW</Text>
          </TouchableOpacity>
        </View>
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
  recoveryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  recoveryTextCol: {
    flex: 1,
    marginRight: 10,
  },
  recoveryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.warning,
  },
  recoveryMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  retryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: COLORS.warning,
  },
  retryBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.background,
  },
  batteryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  batteryText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textSecondary,
    marginRight: 10,
  },
  batteryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  batteryBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.background,
  },
});

