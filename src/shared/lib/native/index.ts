import {
  EmitterSubscription,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';

export type NetworkTransportType =
  | 'wifi'
  | 'cellular'
  | 'ethernet'
  | 'none'
  | 'unknown';

export type StreamGuardRecoveryPhase =
  | 'idle'
  | 'monitoring'
  | 'reconnecting'
  | 'recovered'
  | 'failed';

export interface StreamNetworkStateEvent {
  isConnected: boolean;
  transport: NetworkTransportType;
  timestamp: number;
}

export interface StreamRecoveryStatusEvent {
  phase: StreamGuardRecoveryPhase;
  attempt: number;
  delayMs: number;
  streamUrl: string;
  reason: string;
}

export interface StreamGuardNativeModuleContract {
  startMonitoring(streamUrl: string): Promise<void>;
  stopMonitoring(): Promise<void>;
  triggerManualReconnect(): Promise<void>;
  isIgnoringBatteryOptimizations(): Promise<boolean>;
  requestIgnoreBatteryOptimizations(): Promise<boolean>;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export const STREAM_GUARD_EVENTS = {
  NetworkState: 'StreamGuardNetworkState',
  RecoveryStatus: 'StreamGuardRecoveryStatus',
} as const;

const rawNativeModule = NativeModules.StreamGuardModule as
  | StreamGuardNativeModuleContract
  | undefined;

export const StreamGuardNative: StreamGuardNativeModuleContract = {
  startMonitoring: async (streamUrl: string): Promise<void> => {
    if (rawNativeModule) {
      await rawNativeModule.startMonitoring(streamUrl);
    }
  },
  stopMonitoring: async (): Promise<void> => {
    if (rawNativeModule) {
      await rawNativeModule.stopMonitoring();
    }
  },
  triggerManualReconnect: async (): Promise<void> => {
    if (rawNativeModule) {
      await rawNativeModule.triggerManualReconnect();
    }
  },
  isIgnoringBatteryOptimizations: async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true;
    }
    if (rawNativeModule) {
      return rawNativeModule.isIgnoringBatteryOptimizations();
    }
    return true;
  },
  requestIgnoreBatteryOptimizations: async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true;
    }
    if (rawNativeModule) {
      return rawNativeModule.requestIgnoreBatteryOptimizations();
    }
    return true;
  },
  addListener: (eventName: string): void => {
    rawNativeModule?.addListener(eventName);
  },
  removeListeners: (count: number): void => {
    rawNativeModule?.removeListeners(count);
  },
};

const eventEmitter = rawNativeModule
  ? new NativeEventEmitter(rawNativeModule)
  : null;

export function subscribeToStreamNetworkState(
  listener: (event: StreamNetworkStateEvent) => void,
): EmitterSubscription | null {
  if (!eventEmitter) {
    return null;
  }
  return eventEmitter.addListener(STREAM_GUARD_EVENTS.NetworkState, listener);
}

export function subscribeToStreamRecoveryStatus(
  listener: (event: StreamRecoveryStatusEvent) => void,
): EmitterSubscription | null {
  if (!eventEmitter) {
    return null;
  }
  return eventEmitter.addListener(STREAM_GUARD_EVENTS.RecoveryStatus, listener);
}
