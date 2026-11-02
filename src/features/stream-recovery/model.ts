import { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
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
  const radioStreamUrl = usePlayerStore((state) =>
    state.activeTrack?.sourceType === 'radio'
      ? state.activeTrack.streamOrFileUrl
      : null,
  );
  const shouldMonitor = usePlayerStore(
    (state) => state.isPlaying || state.playbackError !== null,
  );

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
          current.streamOrFileUrl === event.streamUrl &&
          (!playerState.isPlaying || playerState.playbackError !== null)
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
    if (radioStreamUrl !== null && shouldMonitor) {
      StreamGuardNative.startMonitoring(radioStreamUrl).catch(() => {});
    } else {
      StreamGuardNative.stopMonitoring().catch(() => {});
    }
  }, [radioStreamUrl, shouldMonitor]);
}

export interface UseStreamRecoveryBannerResult {
  visible: boolean;
  showReconnectBanner: boolean;
  showBatteryBanner: boolean;
  recoveryTitle: string;
  recoveryMeta: string;
  onRetryNow: () => void;
  onRequestBatteryExemption: () => void;
}

export function useStreamRecoveryBanner(): UseStreamRecoveryBannerResult {
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

  const isRadioActive = usePlayerStore(
    (state) => state.activeTrack?.sourceType === 'radio',
  );
  const showReconnectBanner =
    isRadioActive && (phase === 'reconnecting' || phase === 'failed' || !isConnected);
  const showBatteryBanner = Platform.OS === 'android' && !isIgnoringBattery;
  const visible = showReconnectBanner || showBatteryBanner;

  const recoveryTitle =
    phase === 'failed'
      ? 'Stream Disconnected'
      : `StreamGuard Reconnecting (Attempt #${Math.max(1, attempt)})`;

  const networkLabel = isConnected ? transport.toUpperCase() : 'OFFLINE';
  const backoffSuffix = delayMs > 0 ? ` • Backoff ${Math.round(delayMs / 1000)}s` : '';
  const recoveryMeta = `Network: ${networkLabel}${backoffSuffix}`;

  const onRetryNow = useCallback(() => {
    StreamGuardNative.triggerManualReconnect().catch(() => {});
  }, []);

  const onRequestBatteryExemption = useCallback(() => {
    StreamGuardNative.requestIgnoreBatteryOptimizations()
      .then((granted) => {
        setBatteryOptimizationIgnored(granted);
      })
      .catch(() => {});
  }, [setBatteryOptimizationIgnored]);

  return {
    visible,
    showReconnectBanner,
    showBatteryBanner,
    recoveryTitle,
    recoveryMeta,
    onRetryNow,
    onRequestBatteryExemption,
  };
}

