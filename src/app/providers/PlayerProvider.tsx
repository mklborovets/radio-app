import React, { PropsWithChildren, useEffect } from 'react';
import { ensureTrackPlayerInitialized } from '@entities/player';

export function PlayerProvider({ children }: PropsWithChildren): React.JSX.Element {
  useEffect(() => {
    ensureTrackPlayerInitialized().catch(() => {});
  }, []);

  return <>{children}</>;
}
