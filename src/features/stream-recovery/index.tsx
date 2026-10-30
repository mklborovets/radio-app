import React, { useEffect } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { create } from 'zustand';
import { startPlayableTrack, usePlayerStore } from '@entities/player';
import {
  NetworkTransportType,
  StreamGuardNative,
  StreamGuardRecoveryPhase,
  StreamNetworkStateEvent,
  StreamRecoveryStatusEvent,
  subscribeToStreamNetworkState,
  subscribeToStreamRecoveryStatus,
} from '@shared/lib/native';
import { COLORS } from '@shared/ui';

export interface StreamRecoveryBannerState {
  phase: StreamGuardRecoveryPhase;
  attempt: number;
  delayMs: number;
  reason: string;
  isConnected: boolean;
  transport: NetworkTransportType;
  isIgnoringBatteryOptimizations: boolean;
}

export interface StreamRecoveryStore extends StreamRecoveryBannerState {
  setRecoveryStatus: (event: StreamRecoveryStatusEvent) => void;
  setNetworkState: (event: StreamNetworkStateEvent) => void;
  setBatteryOptimizationIgnored: (ignored: boolean) => void;
}

export const useStreamRecoveryStore = create<StreamRecoveryStore>((set) => ({
  phase: 'idle',
  attempt: 0,
  delayMs: 0,
  reason: '',
  isConnected: true,
  transport: 'unknown',
  isIgnoringBatteryOptimizations: true,
  setRecoveryStatus: (event) =>
    set({
      phase: event.phase,
      attempt: event.attempt,
      delayMs: event.delayMs,
      reason: event.reason,
    }),
  setNetworkState: (event) =>
    set({
      isConnected: event.isConnected,
      transport: event.transport,
    }),
  setBatteryOptimizationIgnored: (isIgnoringBatteryOptimizations) =>
    set({ isIgnoringBatteryOptimizations }),
}));

export function useStreamGuardCoordinator(): void {
  const activeTrack = usePlayerStore((state) => state.activeTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);

  useEffect(() => {
    StreamGuardNative.isIgnoringBatteryOptimizations()
      .then((ignored) => {
        useStreamRecoveryStore.getState().setBatteryOptimizationIgnored(ignored);
      })
      .catch(() => {});

    const netSub = subscribeToStreamNetworkState((event) => {
      useStreamRecoveryStore.getState().setNetworkState(event);
    });

    const recoverySub = subscribeToStreamRecoveryStatus((event) => {
      useStreamRecoveryStore.getState().setRecoveryStatus(event);

      if (event.phase === 'recovered') {
        const playerState = usePlayerStore.getState();
        const current = playerState.activeTrack;
        if (
          current &&
          current.sourceType === 'radio' &&
          current.streamOrFileUrl === event.streamUrl
        ) {
          startPlayableTrack(current, 0).catch(() => {});
        }
      }
    });

    return () => {
      netSub?.remove();
      recoverySub?.remove();
    };
  }, []);

  useEffect(() => {
    if (activeTrack && activeTrack.sourceType === 'radio' && isPlaying) {
      StreamGuardNative.startMonitoring(activeTrack.streamOrFileUrl).catch(() => {});
    } else {
      StreamGuardNative.stopMonitoring().catch(() => {});
    }
  }, [activeTrack, isPlaying]);
}

export function StreamRecoveryBanner(): React.JSX.Element | null {
  const phase = useStreamRecoveryStore((state) => state.phase);
  const attempt = useStreamRecoveryStore((state) => state.attempt);
  const delayMs = useStreamRecoveryStore((state) => state.delayMs);
  const isConnected = useStreamRecoveryStore((state) => state.isConnected);
  const transport = useStreamRecoveryStore((state) => state.transport);
  const isIgnoringBattery = useStreamRecoveryStore(
    (state) => state.isIgnoringBatteryOptimizations,
  );
  const setBatteryOptimizationIgnored = useStreamRecoveryStore(
    (state) => state.setBatteryOptimizationIgnored,
  );

  const showReconnectBanner = phase === 'reconnecting' || phase === 'failed' || !isConnected;
  const showBatteryBanner = Platform.OS === 'android' && !isIgnoringBattery;

  if (!showReconnectBanner && !showBatteryBanner) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      {showReconnectBanner && (
        <View style={styles.recoveryCard}>
          <View style={styles.recoveryTextCol}>
            <Text style={styles.recoveryTitle}>
              {phase === 'failed'
                ? 'Stream Disconnected'
                : `StreamGuard Reconnecting (Attempt #${Math.max(1, attempt)})`}
            </Text>
            <Text style={styles.recoveryMeta}>
              Network: {isConnected ? transport.toUpperCase() : 'OFFLINE'}
              {delayMs > 0 ? ` • Backoff ${Math.round(delayMs / 1000)}s` : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              StreamGuardNative.triggerManualReconnect().catch(() => {});
            }}>
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
            onPress={() => {
              StreamGuardNative.requestIgnoreBatteryOptimizations()
                .then((granted) => {
                  setBatteryOptimizationIgnored(granted);
                })
                .catch(() => {});
            }}>
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
