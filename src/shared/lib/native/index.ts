export type NetworkTransportType = 'wifi' | 'cellular' | 'ethernet' | 'none' | 'unknown';

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
