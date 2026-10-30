import { StreamGuardRecoveryPhase } from '@shared/lib/native';

export interface StreamRecoveryBannerState {
  phase: StreamGuardRecoveryPhase;
  attempt: number;
  delayMs: number;
}
